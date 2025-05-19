
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert'; // Renamed to avoid conflict
import { ShieldAlert, Users, UserCog, Save, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User, Role } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const userEditFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  role: z.enum(["Admin", "User"], { required_error: "El rol es obligatorio." }),
});

type UserEditFormValues = z.infer<typeof userEditFormSchema>;

interface DeleteUserConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isDeleting: boolean;
}

function DeleteUserConfirmationDialog({ isOpen, onClose, onConfirm, userName, isDeleting }: DeleteUserConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Confirmar Eliminación
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar al usuario <strong>{userName}</strong>? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Eliminar Usuario
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


interface EditUserDialogProps {
  user: User | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void; 
}

function EditUserDialog({ user, currentUser, isOpen, onClose, onUserUpdate }: EditUserDialogProps) {
  const { updateUserByAdmin, deleteUserByAdmin } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      name: user?.name || "",
      role: user?.role || "User",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        role: user.role,
      });
    }
  }, [user, form]);

  if (!user) return null;

  const onSubmit = async (data: UserEditFormValues) => {
    setIsSubmitting(true);
    const success = await updateUserByAdmin(user.id, data);
    setIsSubmitting(false);
    if (success) {
      toast({
        title: "Usuario Actualizado",
        description: `Los datos de ${data.name} han sido actualizados.`,
      });
      onUserUpdate();
      onClose();
    } else {
      toast({
        title: "Actualización Fallida",
        description: "No se pudo actualizar el usuario. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!user || (currentUser && currentUser.id === user.id)) {
        toast({
            title: "Acción no permitida",
            description: "No puedes eliminar tu propia cuenta.",
            variant: "destructive",
        });
        setIsDeleteConfirmOpen(false);
        return;
    }
    setIsDeleting(true);
    const result = await deleteUserByAdmin(user.id);
    setIsDeleting(false);
    
    if (result.success) {
        toast({
            title: "Usuario Eliminado",
            description: result.message,
        });
        onUserUpdate(); // Refresh list
        onClose(); // Close edit dialog
    } else {
        toast({
            title: "Eliminación Fallida",
            description: result.message,
            variant: "destructive",
        });
    }
    setIsDeleteConfirmOpen(false); // Close confirmation dialog regardless of outcome
  };

  const canDelete = currentUser && user && currentUser.id !== user.id;


  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-sm"> {/* Changed sm:max-w-md to sm:max-w-sm */}
          <DialogHeader>
            <DialogTitle>Gestionar Usuario: {user.name}</DialogTitle>
            <DialogDescription>
              Modifica el nombre y el rol del usuario, o elimínalo del sistema.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="User">Usuario</SelectItem>
                        <SelectItem value="Admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-2">
                <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => setIsDeleteConfirmOpen(true)} 
                    disabled={isSubmitting || isDeleting || !canDelete}
                    className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Usuario
                </Button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting || isDeleting} className="w-full sm:w-auto">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteUserConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteUser}
        userName={user.name}
        isDeleting={isDeleting}
      />
    </>
  );
}


function UserRow({ user, onManageClick }: { user: User; onManageClick: (user: User) => void; }) {
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${getInitials(user.name)}`} alt={user.name || 'Usuario'} data-ai-hint="avatar perfil" />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          {user.name}
        </div>
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
          {user.role === "Admin" ? "Administrador" : "Usuario"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" onClick={() => onManageClick(user)}>
          <UserCog className="mr-2 h-4 w-4" />
          Gestionar
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function UserManagementPage() {
  const { user: currentUser, role, getAllUsers } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);

  useEffect(() => {
    if (getAllUsers) {
      setUsers(getAllUsers());
    }
  }, [getAllUsers]);

  const handleManageUser = (userToManage: User) => {
    setSelectedUser(userToManage);
    setIsEditUserDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsEditUserDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdate = () => {
     if (getAllUsers) {
      setUsers(getAllUsers()); 
    }
  };


  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <RadixAlertTitle className="text-xl font-bold">Acceso Denegado</RadixAlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder a la Gestión de Usuarios. Esta área está restringida a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Users className="mr-3 h-8 w-8 text-primary" />Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Gestionar usuarios, roles y permisos.
        </p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Ver y gestionar todos los usuarios del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="font-semibold">No hay usuarios para mostrar.</p>
              <p className="text-sm text-muted-foreground">Actualmente no hay usuarios registrados en el sistema.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <UserRow key={user.id} user={user} onManageClick={handleManageUser} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <EditUserDialog 
        user={selectedUser} 
        currentUser={currentUser}
        isOpen={isEditUserDialogOpen} 
        onClose={handleCloseDialog}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
}


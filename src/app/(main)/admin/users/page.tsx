// src/app/(main)/admin/users/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Users, UserCog, Save, Loader2, Trash2, AlertTriangle, Building, LockKeyhole, Printer } from 'lucide-react'; // Added Printer icon
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as RadixAlertDialogTitle,
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

const NO_DEPARTMENT_VALUE = "_NO_DEPARTMENT_";

const DEPARTMENTS = [
  "Admision", "Caja", "Radiologia", "Laboratorio", "CDI", "Cardiovascular",
  "Jefa Enfermeras", "Contabilidad", "Administracion", "RRHH", "Honorarios",
  "Seguros", "Pediatria", "UCI", "Ocupacional", "Gerencia",
  "Asistente Gerencia", "Sistemas", "Presidente", "Tesoreria", "Equipos Medicos", "Gerencia Sistemas", "Suministros",
  NO_DEPARTMENT_VALUE
];

const DEPARTMENT_DISPLAY_MAP: { [key: string]: string } = {
  [NO_DEPARTMENT_VALUE]: "Sin Departamento",
  "Admision": "Admisión",
  "Caja": "Caja",
  "Radiologia": "Radiología",
  "Laboratorio": "Laboratorio",
  "CDI": "CDI",
  "Cardiovascular": "Cardiovascular",
  "Jefa Enfermeras": "Jefa Enfermeras",
  "Contabilidad": "Contabilidad",
  "Administracion": "Administración",
  "RRHH": "RRHH",
  "Honorarios": "Honorarios",
  "Seguros": "Seguros",
  "Pediatria": "Pediatría",
  "UCI": "UCI",
  "Ocupacional": "Ocupacional",
  "Gerencia": "Gerencia",
  "Asistente Gerencia": "Asistente Gerencia",
  "Sistemas": "Sistemas",
  "Presidente": "Presidente",
  "Tesoreria": "Tesorería",
  "Equipos Medicos": "Equipos Médicos",
  "Gerencia Sistemas": "Gerencia Sistemas",
  "Suministros": "Suministros",
};

// ROLES_OPTIONS_BASE se mantiene para mostrar el texto en el frontend
const ROLES_OPTIONS_BASE: Role[] = ["User", "Admin", "Presidente"]; // Valores que se mostrarán en la UI
// ROLES_OPTIONS_ZOD DEBE contener los valores exactos del enum de Prisma (sin espacios)
const ROLES_OPTIONS_ZOD = ["User", "Admin", "Presidente"] as const; // Definir los valores de Zod/Prisma sin espacio


const userEditFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce una dirección de correo válida." }),
  role: z.enum(ROLES_OPTIONS_ZOD, { required_error: "El rol es obligatorio." }), // Usar la lista con el valor sin espacio
  department: z.string().optional(),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }).optional().or(z.literal('')),
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
          <RadixAlertDialogTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Confirmar Eliminación
          </RadixAlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar al usuario <strong>{userName}</strong>? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* CORRECCIÓN: Eliminar la prop 'size' */}
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          {/* CORRECCIÓN: Eliminar la prop 'size' */}
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


interface EditUserDialogProps {
  userToEdit: User | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

function EditUserDialog({ userToEdit, currentUser, isOpen, onClose, onUserUpdate }: EditUserDialogProps) {
  const { updateUserByAdmin, deleteUserByAdmin } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      name: userToEdit?.name || "",
      email: userToEdit?.email || "",
      // Mapear el rol que viene del `userToEdit` para que coincida con Zod
      role: userToEdit?.role === "Presidente" ? "Presidente" : (userToEdit?.role || "User"),
      department: userToEdit?.department || NO_DEPARTMENT_VALUE,
      password: "",
    },
  });

  useEffect(() => {
    if (userToEdit) {
      form.reset({
        name: userToEdit.name,
        email: userToEdit.email,
        // Mapear en el reset también
        role: userToEdit.role === "Presidente" ? "Presidente" : userToEdit.role,
        department: userToEdit.department || NO_DEPARTMENT_VALUE,
        password: userToEdit.password || "",
      });
    }
  }, [userToEdit, form]);

  if (!userToEdit) return null;

  const onSubmit = async (data: UserEditFormValues) => {
    setIsSubmitting(true);
    const departmentToSave = data.department === NO_DEPARTMENT_VALUE ? undefined : data.department;

    const updateData: Partial<UserEditFormValues> = {
        name: data.name,
        email: data.email,
        // Asegurarse de que el rol enviado sea "Presidente" sin espacio
        role: data.role === "Presidente" ? "Presidente" : data.role,
        department: departmentToSave
    };
    if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
    } else {
      // Si el campo de contraseña está vacío, no lo enviamos como parte de la actualización,
      // lo que implica que la contraseña debe permanecer sin cambios.
      delete updateData.password;
    }

    const result = await updateUserByAdmin(userToEdit.id, updateData as Partial<Pick<User, 'name' | 'role' | 'email' | 'department' | 'password'>>);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Usuario Actualizado",
        description: result.message || `Los datos de ${data.name} han sido actualizados.`,
      });
      onUserUpdate();
      onClose();
    } else {
      toast({
        title: "Actualización Fallida",
        description: result.message || "No se pudo actualizar el usuario. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToEdit || (currentUser && currentUser.id === userToEdit.id)) {
        toast({
            title: "Acción no permitida",
            description: "No puedes eliminar tu propia cuenta.",
            variant: "destructive",
        });
        setIsDeleteConfirmOpen(false);
        return;
    }
    setIsDeleting(true);
    const result = await deleteUserByAdmin(userToEdit.id);
    setIsDeleting(false);

    if (result.success) {
        toast({
            title: "Usuario Eliminado",
            description: result.message || "Usuario eliminado.",
        });
        onUserUpdate();
        onClose();
    } else {
        toast({
            title: "Eliminación Fallida",
            description: result.message || "No se pudo eliminar el usuario.",
            variant: "destructive",
        });
    }
    setIsDeleteConfirmOpen(false);
  };

  const canDelete = currentUser && userToEdit && currentUser.id !== userToEdit.id;


  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gestionar Usuario: {userToEdit.name}</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario, cambia su contraseña o elimínalo del sistema.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-6">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@ejemplo.com" {...field} />
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
                        {ROLES_OPTIONS_BASE.map((roleOption) => (
                           // El 'value' debe ser 'Presidente' sin espacio para la validación/DB
                           <SelectItem key={roleOption} value={
                               roleOption === "Presidente" ? "Presidente" : roleOption
                           }>
                             {/* El texto que se muestra al usuario puede seguir siendo con espacio */}
                             {roleOption}
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || NO_DEPARTMENT_VALUE}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un departamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map((deptKey) => (
                          <SelectItem key={deptKey} value={deptKey}>
                            {DEPARTMENT_DISPLAY_MAP[deptKey] || deptKey}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                        <LockKeyhole className="mr-2 h-4 w-4 text-muted-foreground" />
                        Contraseña (Dejar en blanco para mantener la contraseña actual)
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Dejar en blanco para mantener la contraseña actual" showPasswordToggle {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2 pt-6">
                <Button
                    type="button"
                    variant="destructive"
                    // CORRECCIÓN: Eliminar la prop 'size'
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={isSubmitting || isDeleting || !canDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting || isDeleting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteUserConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteUser}
        userName={userToEdit.name}
        isDeleting={isDeleting}
      />
    </>
  );
}


function UserRow({ user: userEntry, onManageClick }: { user: User; onManageClick: (user: User) => void; }) {
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const roleDisplayMap: Record<Role, string> = {
    "User": "Usuario",
    "Admin": "Administrador",
    // CORRECCIÓN: Usar el valor sin espacio para la clave del mapeo
    "Presidente": "Presidente"
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={userEntry.avatarUrl || `https://placehold.co/40x40.png?text=${getInitials(userEntry.name)}`} alt={userEntry.name || 'Usuario'} data-ai-hint="avatar perfil"/>
            <AvatarFallback>{getInitials(userEntry.name)}</AvatarFallback>
          </Avatar>
          {userEntry.name}
        </div>
      </TableCell>
      <TableCell>{userEntry.email}</TableCell>
      <TableCell>
        <Badge variant={userEntry.role === "Admin" ? "default" : (userEntry.role === "Presidente" ? "secondary" : "outline")}>
           {/* CORRECCIÓN: Acceder al mapeo con el valor que viene de userEntry.role (que ahora será sin espacio) */}
           {roleDisplayMap[userEntry.role] || userEntry.role}
        </Badge>
      </TableCell>
      <TableCell>{userEntry.department ? (DEPARTMENT_DISPLAY_MAP[userEntry.department] || userEntry.department) : <span className="text-muted-foreground">N/A</span>}</TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" onClick={() => onManageClick(userEntry)}>
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
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (getAllUsers) {
      setIsLoadingUsers(true);
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]); // Set to empty array on error
      } finally {
        setIsLoadingUsers(false);
      }
    } else {
      setUsers([]);
      setIsLoadingUsers(false);
    }
  }, [getAllUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleManageUser = (userToManage: User) => {
    setSelectedUser(userToManage);
    setIsEditUserDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsEditUserDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdate = () => {
    fetchUsers(); // Refetch users after an update
  };

  const handlePrint = () => {
    window.print();
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
    <div className="space-y-8 w-full">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Users className="mr-3 h-8 w-8 text-primary" />Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Gestionar usuarios, roles, departamentos y permisos.
        </p>
      </div>
      <Card className="w-full shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Usuarios</CardTitle>
            {/* Botón de Imprimir */}
            <Button onClick={handlePrint} size="sm" variant="secondary">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
            </Button>
          </div>
          <CardDescription>Ver y gestionar todos los usuarios del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Cargando usuarios...</p>
            </div>
          ) : !Array.isArray(users) || users.length === 0 ? (
            <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="font-semibold">No hay usuarios para mostrar.</p>
              <p className="text-sm text-muted-foreground">Actualmente no hay usuarios registrados en el sistema o no se pudieron cargar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userEntry) => (
                  <UserRow key={userEntry.id} user={userEntry} onManageClick={handleManageUser} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {selectedUser && currentUser && (
        <EditUserDialog
          userToEdit={selectedUser}
          currentUser={currentUser}
          isOpen={isEditUserDialogOpen}
          onClose={handleCloseDialog}
          onUserUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}


"use client";

import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from "@/components/ui/alert";
import { CalendarDays, ClipboardCheck, BellRing, PlusCircle, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import { useAuth } from '@/lib/auth-context';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: Date;
}

interface Reminder {
  id: string;
  text: string;
  time: string; // e.g., "09:00"
  date?: Date;
}

export default function AgendaItPage() {
  const { role } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newReminderText, setNewReminderText] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <RadixAlertTitle className="text-xl font-bold">Acceso Denegado</RadixAlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder a la Agenda IT. Esta área está restringida a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAddTask = () => {
    if (newTaskText.trim() === "") return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      dueDate: selectedDate,
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskText("");
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };
  
  const handleAddReminder = () => {
    if (newReminderText.trim() === "" || newReminderTime.trim() === "") return;
    const newReminder: Reminder = {
        id: Date.now().toString(),
        text: newReminderText,
        time: newReminderTime,
        date: selectedDate,
    };
    setReminders(prev => [...prev, newReminder].sort((a,b) => a.time.localeCompare(b.time)));
    setNewReminderText("");
    setNewReminderTime("");
  };

  const handleDeleteReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
  };

  const tasksForSelectedDate = tasks.filter(task => 
    task.dueDate && selectedDate &&
    task.dueDate.toDateString() === selectedDate.toDateString()
  );

  const remindersForSelectedDate = reminders.filter(reminder =>
    reminder.date && selectedDate &&
    reminder.date.toDateString() === selectedDate.toDateString()
  );


  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col items-start">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <CalendarDays className="mr-3 h-8 w-8 text-primary" />
          Agenda IT y Calendario de Tareas
        </h1>
        <p className="text-muted-foreground">
          Visualiza y gestiona tus tareas diarias, recordatorios y mantenimientos programados.
        </p>
      </div>

      <Alert variant="default" className="bg-primary/5 border-primary/30">
        <AlertTriangle className="h-5 w-5 text-primary" />
        <RadixAlertTitle className="text-primary">Funcionalidad en Desarrollo</RadixAlertTitle>
        <AlertDescription>
          Esta sección de Agenda IT es un prototipo. Las tareas y recordatorios son temporales y no se guardan permanentemente.
          La integración completa con notificaciones y persistencia de datos se implementará en futuras versiones.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
            <CardDescription>Selecciona una fecha para ver y añadir eventos.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              initialFocus
            />
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><ClipboardCheck className="mr-2 h-6 w-6 text-primary"/>Tareas para {selectedDate ? selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Hoy'}</CardTitle>
              <CardDescription>Gestiona tus tareas pendientes para la fecha seleccionada.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input 
                    value={newTaskText} 
                    onChange={(e) => setNewTaskText(e.target.value)} 
                    placeholder="Nueva tarea..." 
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <Button onClick={handleAddTask}><PlusCircle className="mr-2 h-4 w-4"/>Añadir</Button>
              </div>
              <ScrollArea className="h-[200px] pr-4">
                {tasksForSelectedDate.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay tareas para esta fecha.</p>
                ) : (
                  <ul className="space-y-2">
                    {tasksForSelectedDate.map(task => (
                      <li key={task.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`task-${task.id}`} 
                            checked={task.completed} 
                            onCheckedChange={() => handleToggleTask(task.id)}
                          />
                          <label htmlFor={`task-${task.id}`} className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.text}
                          </label>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><BellRing className="mr-2 h-6 w-6 text-primary"/>Recordatorios para {selectedDate ? selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : 'Hoy'}</CardTitle>
               <CardDescription>Añade y visualiza recordatorios importantes.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-4">
                    <Input 
                        value={newReminderText} 
                        onChange={(e) => setNewReminderText(e.target.value)} 
                        placeholder="Descripción del recordatorio..."
                        className="flex-grow"
                    />
                    <Input
                        type="time"
                        value={newReminderTime}
                        onChange={(e) => setNewReminderTime(e.target.value)}
                        className="w-[120px]"
                    />
                    <Button onClick={handleAddReminder}><PlusCircle className="mr-2 h-4 w-4"/>Añadir</Button>
                </div>
                <ScrollArea className="h-[150px] pr-4">
                 {remindersForSelectedDate.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay recordatorios para esta fecha.</p>
                    ) : (
                    <ul className="space-y-2">
                        {remindersForSelectedDate.map(reminder => (
                        <li key={reminder.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-primary">{reminder.time}</span>
                                <span className="text-sm">{reminder.text}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteReminder(reminder.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4"/>
                            </Button>
                        </li>
                        ))}
                    </ul>
                    )}
                </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { HelpCircle, LifeBuoy, Mail, Phone } from "lucide-react";

const faqs = [
  {
    question: "¿Cómo creo un nuevo ticket de soporte?",
    answer: "Para crear un nuevo ticket, dirígete a la sección 'Tickets' en el panel lateral y haz clic en 'Nuevo Ticket'. Completa el formulario con los detalles de tu solicitud y envíalo."
  },
  {
    question: "¿Cómo puedo ver el estado de mis tickets?",
    answer: "Puedes ver todos tus tickets y su estado actual en la sección 'Tickets' > 'Todos los Tickets'. Si eres un usuario general, solo verás los tickets que tú has creado. Los administradores pueden ver todos los tickets."
  },
  {
    question: "¿Cómo cambio mi contraseña?",
    answer: "Puedes cambiar tu contraseña desde tu página de 'Perfil'. Encontrarás una sección dedicada para actualizar tu contraseña."
  },
  {
    question: "¿Qué hago si olvidé mi contraseña?",
    answer: "En la página de inicio de sesión, haz clic en el enlace '¿Olvidó su contraseña?'. Se te guiará a través del proceso para restablecerla."
  },
  {
    question: "¿Quién puede acceder al módulo de Inventario y Administración?",
    answer: "Los módulos de Inventario, Usuarios, Analíticas, Auditoría y Configuración de la Aplicación son accesibles únicamente por usuarios con el rol de Administrador."
  },
  {
    question: "¿Cómo solicito acceso remoto?",
    answer: "Navega a la sección 'Acceso Remoto' en el panel lateral. Completa el formulario con tu ID de AnyDesk y el motivo de la solicitud. Esto creará un ticket de soporte que será atendido por un técnico."
  }
];

const technicalIssues = [
  {
    problem: "No puedo iniciar sesión (error de usuario o contraseña)",
    solution: "Verifica que tu correo y contraseña estén escritos correctamente. Si olvidaste tu contraseña, utiliza la opción '¿Olvidó su contraseña?' en la pantalla de inicio de sesión para restablecerla." 
  },
  {
    problem: "La aplicación no carga o muestra una pantalla en blanco",
    solution: "Intenta recargar la página (Ctrl+R o F5). Si el problema persiste, borra la caché de tu navegador o prueba en una ventana de incógnito. Si sigue sin funcionar, contacta a soporte." 
  },
  {
    problem: "No recibo correos de notificación",
    solution: "Revisa la carpeta de spam o correo no deseado. Si no encuentras los correos, asegúrate de que tu dirección esté escrita correctamente en tu perfil y contacta a soporte si el problema continúa." 
  },
  {
    problem: "No puedo adjuntar archivos a un ticket",
    solution: "Verifica que el archivo no exceda el tamaño permitido y que el formato sea compatible (PDF, JPG, PNG, etc.). Si el problema persiste, intenta desde otro navegador o dispositivo." 
  },
  {
    problem: "No puedo acceder a ciertos módulos (Inventario, Administración, etc.)",
    solution: "Algunos módulos solo están disponibles para usuarios con permisos de Administrador. Si necesitas acceso, contacta a tu administrador o a soporte." 
  }
];

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <HelpCircle className="mr-3 h-8 w-8 text-primary" />
          Centro de Ayuda y Preguntas Frecuentes (FAQ)
        </h1>
        <p className="text-muted-foreground">
          Encuentra respuestas a preguntas comunes y cómo obtener soporte adicional.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Preguntas Frecuentes (FAQ)</CardTitle>
          <CardDescription>Respuestas rápidas a las dudas más comunes.</CardDescription>
        </CardHeader>
        <CardContent>
          {faqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="prose prose-sm max-w-none text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground">No hay preguntas frecuentes disponibles en este momento.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Problemas Frecuentes</CardTitle>
          <CardDescription>Soluciones rápidas a problemas técnicos comunes en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          {technicalIssues.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {technicalIssues.map((issue, idx) => (
                <AccordionItem value={`tech-issue-${idx}`} key={idx}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    {issue.problem}
                  </AccordionTrigger>
                  <AccordionContent className="prose prose-sm max-w-none text-muted-foreground">
                    {issue.solution}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground">No hay problemas frecuentes registrados en este momento.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LifeBuoy className="mr-2 h-6 w-6 text-primary" />
            ¿Necesitas Más Ayuda?
          </CardTitle>
          <CardDescription>Si no encuentras la respuesta a tu pregunta, contáctanos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold flex items-center"><Mail className="mr-2 h-5 w-5 text-primary/80"/>Soporte por Correo Electrónico:</h3>
            <p className="text-muted-foreground">
              Envíanos un correo a 
              <a href="mailto:sistemas@clinicaieq.com" className="text-primary hover:underline">sistemas@clinicaieq.com</a> / 
              <a href="mailto:gerencia_sistemas@clinicaieq.com" className="text-primary hover:underline">gerencia_sistemas@clinicaieq.com</a>
              y te responderemos a la brevedad.
            </p>
          </div>
          <div>
            <h3 className="font-semibold flex items-center"><Phone className="mr-2 h-5 w-5 text-primary/80"/>Soporte Telefónico:</h3>
            <p className="text-muted-foreground">
              Llámanos a la <span className="text-primary font-medium">EXT- 211/212</span>
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Crear un Ticket:</h3>
            <p className="text-muted-foreground">
              Si tienes un problema específico, la forma más eficiente de obtener ayuda es creando un nuevo ticket de soporte directamente en la aplicación a través de la sección "Tickets".
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

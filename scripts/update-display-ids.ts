import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateSequentialId(entityName: string): Promise<string> {
  const counter = await prisma.idCounter.upsert({
    where: { entityName },
    update: { lastUsedNumber: { increment: 1 } },
    create: { entityName, lastUsedNumber: 1 },
  });
  return `${entityName}-${counter.lastUsedNumber}`;
}

async function updateDisplayIds() {
  try {
    // Actualizar Users
    const users = await prisma.user.findMany();
    for (const user of users) {
      if (!user.displayId) {
        const newDisplayId = await generateSequentialId('User');
        await prisma.user.update({
          where: { id: user.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated User ${user.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar Tickets
    const tickets = await prisma.ticket.findMany();
    for (const ticket of tickets) {
      if (!ticket.displayId) {
        const newDisplayId = await generateSequentialId('Ticket');
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated Ticket ${ticket.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar Comments
    const comments = await prisma.comment.findMany();
    for (const comment of comments) {
      if (!comment.displayId) {
        const newDisplayId = await generateSequentialId('Comment');
        await prisma.comment.update({
          where: { id: comment.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated Comment ${comment.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar Attachments
    const attachments = await prisma.attachment.findMany();
    for (const attachment of attachments) {
      if (!attachment.displayId) {
        const newDisplayId = await generateSequentialId('Attachment');
        await prisma.attachment.update({
          where: { id: attachment.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated Attachment ${attachment.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar InventoryItems
    const inventoryItems = await prisma.inventoryItem.findMany();
    for (const item of inventoryItems) {
      if (!item.displayId) {
        const newDisplayId = await generateSequentialId('InventoryItem');
        await prisma.inventoryItem.update({
          where: { id: item.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated InventoryItem ${item.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar ApprovalRequests
    const approvalRequests = await prisma.approvalRequest.findMany();
    for (const request of approvalRequests) {
      if (!request.displayId) {
        const newDisplayId = await generateSequentialId('ApprovalRequest');
        await prisma.approvalRequest.update({
          where: { id: request.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated ApprovalRequest ${request.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar PaymentInstallments
    const paymentInstallments = await prisma.paymentInstallment.findMany();
    for (const installment of paymentInstallments) {
      if (!installment.displayId) {
        const newDisplayId = await generateSequentialId('PaymentInstallment');
        await prisma.paymentInstallment.update({
          where: { id: installment.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated PaymentInstallment ${installment.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar ApprovalActivityLogEntries
    const activityLogs = await prisma.approvalActivityLogEntry.findMany();
    for (const log of activityLogs) {
      if (!log.displayId) {
        const newDisplayId = await generateSequentialId('ApprovalActivityLogEntry');
        await prisma.approvalActivityLogEntry.update({
          where: { id: log.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated ApprovalActivityLogEntry ${log.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar CasosDeMantenimiento
    const casosMantenimiento = await prisma.casoDeMantenimiento.findMany();
    for (const caso of casosMantenimiento) {
      if (!caso.displayId) {
        const newDisplayId = await generateSequentialId('CasoDeMantenimiento');
        await prisma.casoDeMantenimiento.update({
          where: { id: caso.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated CasoDeMantenimiento ${caso.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar CasoMantenimientoLogEntries
    const casoLogs = await prisma.casoMantenimientoLogEntry.findMany();
    for (const log of casoLogs) {
      if (!log.displayId) {
        const newDisplayId = await generateSequentialId('CasoMantenimientoLogEntry');
        await prisma.casoMantenimientoLogEntry.update({
          where: { id: log.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated CasoMantenimientoLogEntry ${log.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar AuditLogEntries
    const auditLogs = await prisma.auditLogEntry.findMany();
    for (const log of auditLogs) {
      if (!log.displayId) {
        const newDisplayId = await generateSequentialId('AuditLogEntry');
        await prisma.auditLogEntry.update({
          where: { id: log.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated AuditLogEntry ${log.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar Fallas
    const fallas = await prisma.falla.findMany();
    for (const falla of fallas) {
      if (!falla.displayId) {
        const newDisplayId = await generateSequentialId('Falla');
        await prisma.falla.update({
          where: { id: falla.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated Falla ${falla.id} with displayId ${newDisplayId}`);
      }
    }

    // Actualizar FallaBitacoras
    const fallaBitacoras = await prisma.fallaBitacora.findMany();
    for (const bitacora of fallaBitacoras) {
      if (!bitacora.displayId) {
        const newDisplayId = await generateSequentialId('FallaBitacora');
        await prisma.fallaBitacora.update({
          where: { id: bitacora.id },
          data: { displayId: newDisplayId }
        });
        console.log(`Updated FallaBitacora ${bitacora.id} with displayId ${newDisplayId}`);
      }
    }

    console.log('All displayIds have been updated successfully!');
  } catch (error) {
    console.error('Error updating displayIds:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDisplayIds(); 
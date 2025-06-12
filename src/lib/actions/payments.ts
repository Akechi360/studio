import { PrismaClient } from '@prisma/client';
import { CreatePaymentInstallmentData, PaymentInstallment } from '../types/payments';
import { generateSequentialId } from '../id-generator';
import { cache } from 'react';

const prisma = new PrismaClient();

// Función para actualizar los campos calculados de una solicitud de aprobación
async function updateApprovalRequestCalculatedFields(approvalRequestId: string) {
  const installments = await prisma.paymentInstallment.findMany({
    where: { approvalRequestId },
    orderBy: { dueDate: 'asc' }
  });

  const totalPaidAmount = installments
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);

  const remainingAmount = installments
    .filter(i => i.status !== 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);

  const nextDueDate = installments
    .find(i => i.status === 'PENDING')?.dueDate;

  const hasOverduePayments = installments
    .some(i => i.status === 'OVERDUE');

  await prisma.approvalRequest.update({
    where: { id: approvalRequestId },
    data: {
      totalPaidAmount,
      remainingAmount,
      nextDueDate,
      hasOverduePayments
    }
  });
}

// Función para actualizar el estado de vencimiento de una cuota
async function updateInstallmentOverdueStatus(installment: PaymentInstallment) {
  const now = new Date();
  const isOverdue = installment.status === 'PENDING' && installment.dueDate < now;
  const daysOverdue = isOverdue 
    ? Math.floor((now.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isOverdue && installment.status === 'PENDING') {
    await prisma.paymentInstallment.update({
      where: { id: installment.id },
      data: {
        status: 'OVERDUE',
        isOverdue: true,
        daysOverdue
      }
    });
  }
}

export async function createPaymentInstallment(data: CreatePaymentInstallmentData): Promise<PaymentInstallment> {
  const { amount, dueDate, approvalRequestId } = data;
  const displayId = await generateSequentialId('PaymentInstallment');

  const result = await prisma.$transaction(async (tx) => {
    const installment = await tx.paymentInstallment.create({
      data: {
        amount,
        dueDate,
        approvalRequestId,
        displayId,
        status: 'PENDING',
        isOverdue: false,
        daysOverdue: 0
      },
    });

    await updateApprovalRequestCalculatedFields(approvalRequestId);
    return installment;
  });

  return result;
}

export const getAllPaymentInstallments = cache(async (): Promise<PaymentInstallment[]> => {
  const installments = await prisma.paymentInstallment.findMany({
    include: {
      approvalRequest: true,
    },
    orderBy: {
      dueDate: 'desc',
    },
  });

  // Actualizar estados de vencimiento en segundo plano
  installments.forEach(installment => {
    updateInstallmentOverdueStatus(installment).catch(console.error);
  });

  return installments;
});

export const getPaymentInstallmentById = cache(async (id: string): Promise<PaymentInstallment | null> => {
  const installment = await prisma.paymentInstallment.findUnique({
    where: { id },
    include: {
      approvalRequest: true,
    },
  });

  if (installment) {
    updateInstallmentOverdueStatus(installment).catch(console.error);
  }

  return installment;
});

export async function updatePaymentInstallmentStatus(
  id: string,
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
): Promise<PaymentInstallment> {
  const result = await prisma.$transaction(async (tx) => {
    const installment = await tx.paymentInstallment.update({
      where: { id },
      data: { 
        status,
        isOverdue: status === 'OVERDUE',
        daysOverdue: status === 'OVERDUE' ? 
          Math.floor((new Date().getTime() - (await tx.paymentInstallment.findUnique({ where: { id } }))!.dueDate.getTime()) / (1000 * 60 * 60 * 24)) 
          : 0
      },
      include: {
        approvalRequest: true,
      },
    });

    await updateApprovalRequestCalculatedFields(installment.approvalRequestId);
    return installment;
  });

  return result;
}

export async function deletePaymentInstallment(id: string): Promise<PaymentInstallment> {
  const result = await prisma.$transaction(async (tx) => {
    const installment = await tx.paymentInstallment.delete({
      where: { id },
      include: {
        approvalRequest: true,
      },
    });

    await updateApprovalRequestCalculatedFields(installment.approvalRequestId);
    return installment;
  });

  return result;
} 
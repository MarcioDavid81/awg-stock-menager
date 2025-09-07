import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export interface AuthResult {
  success: boolean;
  payload?: {
    userId: string;
    companyId: string;
  };
  response?: NextResponse;
}

/**
 * Função utilitária para autenticar requisições de API usando cookies
 * @param request - NextRequest object
 * @returns AuthResult com sucesso/falha e payload do token
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const token = request.cookies.get('awg-stock-menager-token')?.value;
  
  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 401 }
      )
    };
  }
  
  const payload = await verifyToken(token);
  
  if (!payload) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    };
  }
  
  return {
    success: true,
    payload
  };
}
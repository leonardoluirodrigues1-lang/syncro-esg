import { SetMetadata } from '@nestjs/common';

export const ROTA_PUBLICA = 'rotaPublica';

// Marca uma rota que não exige login.
export const Publico = () => SetMetadata(ROTA_PUBLICA, true);

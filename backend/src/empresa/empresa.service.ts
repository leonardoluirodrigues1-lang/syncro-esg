import { Injectable } from '@nestjs/common';
import { BancoService } from '../banco/banco.service';
import { EmpresaDto } from './dto/empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(private banco: BancoService) {}

  // A empresa vem sempre do token: ninguém edita a empresa de outra pessoa.
  async editar(empresaId: string, dados: EmpresaDto) {
    await this.banco.executar('UPDATE empresa SET nome = ?, setor = ?, porte = ? WHERE id = ?', [
      dados.nome.trim(),
      dados.setor?.trim() || null, // vazio = sem setor
      dados.porte || null,
      empresaId,
    ]);
    const [empresa] = await this.banco.consultar('SELECT id, nome, cnpj, setor, porte FROM empresa WHERE id = ?', [
      empresaId,
    ]);
    return empresa;
  }
}

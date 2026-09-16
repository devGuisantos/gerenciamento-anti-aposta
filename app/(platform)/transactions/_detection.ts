/**
 * How a classification is worded for the user. `bet-detection` never returns a
 * bare boolean, so the screen never shows one either: every flagged entry names
 * the policy that matched and how sure it is.
 *
 * The betting MCC appears here as a label only. When `bet-detection` lands, the
 * number itself lives there once, as `GAMBLING_MCC`.
 */
import type { DetectionConfidence, DetectionReason } from './_ledger-entry';

export const DETECTION_LABELS: Readonly<Record<DetectionReason, string>> = {
  GAMBLING_MCC: 'MCC 7995',
  LICENSED_CNPJ: 'CNPJ cadastrado',
  DESCRIPTION_KEYWORD: 'Descrição da transação',
};

export const DETECTION_EXPLANATIONS: Readonly<Record<DetectionReason, string>> = {
  GAMBLING_MCC:
    'O estabelecimento está registrado sob o código 7995, usado internacionalmente para apostas e cassinos.',
  LICENSED_CNPJ:
    'O CNPJ que recebeu o valor está na lista de operadoras de apostas licenciadas no Brasil.',
  DESCRIPTION_KEYWORD:
    'A descrição enviada pela instituição contém termos ligados a apostas. É o sinal mais fraco que usamos.',
};

export const CONFIDENCE_LABELS: Readonly<Record<DetectionConfidence, string>> = {
  HIGH: 'Identificação confiável',
  MEDIUM: 'Identificação provável',
  LOW: 'Identificação incerta',
};

/**
 * A weak match is never presented as a fact. Telling someone they gambled when
 * they did not costs more than missing one entry.
 */
export function toBetBadgeLabel(confidence: DetectionConfidence): string {
  return confidence === 'LOW' ? 'Possível aposta' : 'Aposta';
}

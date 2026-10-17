/**
 * On the screen because it is part of what the product is, not only part of how
 * it was built: somebody who has met one of these before will be looking for the
 * score, and the honest answer is that there isn't one. Shown under the summary
 * and under every family's list, wherever badges are.
 */
export function NoScoreNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Aqui não existem pontos, níveis nem comparação com outras pessoas. Nada é sorteado e nada
      aparece por surpresa: as conquistas são as que estão aqui, com os critérios à vista desde o
      começo.
    </p>
  );
}

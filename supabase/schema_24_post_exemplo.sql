-- Rode no SQL Editor do Supabase, depois do schema_23_blog.sql.
--
-- Post de exemplo, pra o blog nao nascer vazio e pra servir de modelo de
-- formatacao (titulo curto, resumo de 2 linhas, paragrafos separados por
-- linha em branco). A Beatriz pode editar ou remover pelo painel.
--
-- Entra como RASCUNHO de proposito: ninguem ve ate ela ler, ajustar o que
-- quiser e marcar "Publicado" na aba Blog.

insert into public.posts (slug, titulo, resumo, conteudo, publicado, publicado_em)
values (
  'o-que-e-fisioterapia-pelvica',
  'O que é fisioterapia pélvica (e quando procurar)',
  'O assoalho pélvico sustenta bexiga, intestino e útero — e, como qualquer ' ||
  'músculo, pode ser treinado. Entenda o que a fisioterapia pélvica trata e ' ||
  'em que momento vale procurar avaliação.',
  E'O assoalho pélvico é um conjunto de músculos que fecha a base da pelve, como uma rede. É ele que sustenta a bexiga, o intestino e o útero, participa do controle urinário e intestinal, da função sexual e da estabilidade do tronco.\n\n'
  'Como qualquer outro músculo do corpo, ele pode enfraquecer, ficar tenso demais ou perder coordenação. A diferença é que quase ninguém aprende a percebê-lo — e por isso é comum conviver anos com um sintoma achando que "é normal".\n\n'
  'O que a fisioterapia pélvica trata\n\n'
  'Perda de urina ao tossir, espirrar, rir ou durante atividade física. Urgência para urinar ou idas frequentes ao banheiro. Dor pélvica persistente. Dor na relação sexual. Preparo para o parto e recuperação no pós-parto. Alterações intestinais, como constipação e dificuldade de controle.\n\n'
  'Como é a avaliação\n\n'
  'A primeira consulta é uma conversa detalhada sobre sintomas, história clínica, rotina e hábitos. Em seguida é feita uma avaliação física do assoalho pélvico, sempre com explicação prévia de cada etapa e respeitando o seu tempo e o seu limite. Nada é feito sem o seu consentimento.\n\n'
  'A partir dessa avaliação é montado um plano individual: não existe um protocolo único que sirva para todo mundo. Um assoalho pélvico fraco e um assoalho pélvico tenso demais podem gerar o mesmo sintoma e exigem tratamentos opostos — é por isso que a avaliação vem antes de qualquer exercício.\n\n'
  'O tratamento continua em casa\n\n'
  'Boa parte do resultado vem da constância entre uma sessão e outra. Por isso cada paciente recebe o plano de exercícios no aplicativo, com vídeo e passo a passo de cada movimento, e pode acompanhar a própria evolução pelo celular.\n\n'
  'Quando procurar\n\n'
  'Não é preciso esperar o sintoma piorar. Se algo acima parece familiar, vale uma avaliação — inclusive de forma preventiva, na gestação ou antes de retomar atividade física.',
  false,
  null
)
on conflict (slug) do nothing;

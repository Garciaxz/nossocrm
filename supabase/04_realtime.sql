-- Habilita Realtime na tabela mensagens.
-- Sem isso, a conversa do lead (SPEC 3.4) nao atualiza sozinha: o
-- vendedor teria que dar F5 pra ver mensagem nova.
alter publication supabase_realtime add table mensagens;

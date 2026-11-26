# MVP: Agendamento online da Barbearia Machado

## Objetivo
Criar uma aplicação web responsiva em português (pt-BR) para agendamento de horários na Barbearia Machado. Quem atende é uma única pessoa, o barbeiro Pablo, então NÃO existe escolha de profissional: a agenda é única. Tese testada: clientes preferem agendar sozinhos por link, e o Pablo reduz o vai-e-vem de mensagens no WhatsApp. Use o Lovable Cloud como back-end (banco e autenticação). NÃO gere imagens: use apenas ícones e gradientes. NÃO integre pagamento nem APIs externas.

## Identidade visual
- Dark mode elegante: fundo #121212, cards #1E1E1E, destaque âmbar #D97706, texto claro com alto contraste.
- Tipografia Inter. Mobile-first, botões grandes.

## Configuração da barbearia (tabela editável no admin)
Nome: Barbearia Machado. Barbeiro: Pablo. WhatsApp: +55 48 98436-5051 (usar sempre o formato 5548984365051 nos links wa.me). Endereço, horário de funcionamento (padrão: segunda a sábado, 09:00 às 19:00), dias fechados (padrão: domingo) e intervalo dos slots (30 min) também ficam nessa tabela. Esses valores iniciais devem ser editáveis no admin, nunca fixos no código.

## Tabela de serviços inicial (editável, ativar/desativar no admin)
| Categoria | Serviço | Duração | Preço |
|---|---|---|---|
| Cabelo | Corte de cabelo | 40 min | R$ 40 |
| Cabelo | Corte degradê (fade) | 45 min | R$ 45 |
| Cabelo | Corte infantil | 30 min | R$ 35 |
| Barba | Barba | 30 min | R$ 30 |
| Barba | Barba terapia (toalha quente) | 40 min | R$ 40 |
| Combos | Cabelo + barba | 70 min | R$ 65 |
| Combos | Corte + sobrancelha | 50 min | R$ 50 |
| Estética | Sobrancelha | 15 min | R$ 15 |
| Estética | Pezinho / acabamento | 15 min | R$ 15 |
| Estética | Pigmentação de barba | 30 min | R$ 30 |
| Estética | Hidratação capilar | 30 min | R$ 35 |
| Estética | Platinado / luzes | 120 min | R$ 120 |

## Fluxo do cliente (página pública)
1. Landing: título "Seu estilo sem fila de espera", subtítulo explicando o agendamento em poucos cliques, "Atendimento com o Pablo", endereço, horários, tabela de preços visível, botão principal "Agendar horário" e botão de WhatsApp.
2. Serviços em cards agrupados por categoria (nome, duração, preço). O cliente pode escolher um ou mais serviços; a duração total é somada e o valor total é exibido.
3. Data e horário: próximos 14 dias, dias fechados bloqueados, fuso America/Sao_Paulo, horários passados de hoje bloqueados. O agendamento ocupa todos os slots de 30 min que a duração total cobre. Horários já reservados ou bloqueados ficam desabilitados.
4. Dados: apenas nome completo e WhatsApp do cliente (máscara e validação de número brasileiro).
5. Confirmação: tela de sucesso com resumo (serviços, data, hora, valor total) e botão "Enviar no WhatsApp da barbearia", que abre o link wa.me com serviços, data, hora e nome já preenchidos.

## Painel admin (rota /admin)
- Login por e-mail e senha (autenticação do Lovable Cloud). Cadastro público DESATIVADO; apenas 1 usuário admin (o Pablo).
- Dashboard: total de agendamentos de hoje, faturamento previsto do dia e próximo cliente.
- Agenda (dia/semana): lista por horário com cliente, serviços, valor, status (Pendente, Confirmado, Concluído, Cancelado, Não compareceu) e marcador "lembrete enviado" (sim/não).
- Ações rápidas: confirmar, concluir e cancelar (cancelar libera o horário na página do cliente). Botão "Lembrar no WhatsApp" que abre wa.me com a mensagem: "Olá [Nome], aqui é o Pablo da Barbearia Machado. Confirmando seu horário de [Serviço] hoje às [Hora]!" e marca "lembrete enviado".
- Bloqueio de horários: o Pablo pode bloquear um horário ou dia inteiro (almoço, folga, compromisso).
- Leads e Clientes: todo novo agendamento entra como lead; ao confirmar ou concluir, o lead vira cliente automaticamente, sem digitar de novo. A aba Clientes mostra histórico, total de visitas e última visita.
- Gerenciar serviços: criar, editar preço, duração e categoria, e ativar/desativar.
- Editar a configuração da barbearia (nome, endereço, WhatsApp, horários, dias fechados).

## Regras de dados e segurança (obrigatório)
- Restrição única no banco impedindo dois agendamentos ativos no mesmo horário; mostrar mensagem amigável se houver conflito.
- RLS ativado em todas as tabelas: o público só pode criar agendamento e consultar quais horários estão ocupados (sem nome nem telefone de ninguém); somente o admin lê e altera dados de clientes.
- Papel de admin em tabela separada. Nenhuma chave, token ou senha no código.
- Cada agendamento deve ter o campo "origem" (valores: "site" ou "whatsapp"; padrão "site"), e a lógica de consultar horários livres e criar agendamento deve ficar centralizada no back-end, não apenas no front-end.

## Ordem de construção
Primeiro modelo de dados e regras de segurança, depois fluxo do cliente, depois painel admin. Cada etapa deve funcionar antes de passar para a próxima. Não adicione funcionalidades além das descritas.

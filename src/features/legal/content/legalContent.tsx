export const LEGAL_CONTENT_VERSION_LABEL = "18 de agosto de 2026";

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export const TERMS_OF_USE_SECTIONS: LegalSection[] = [
  {
    id: "aceitacao",
    title: "1. Aceitação dos Termos",
    content: (
      <p>
        Ao criar uma conta e utilizar a Amore Mio, você declara ter lido,
        compreendido e concordado com estes Termos de Uso e com a nossa Política
        de Privacidade. Se você não concorda com qualquer parte destes termos,
        não utilize a plataforma.
      </p>
    ),
  },
  {
    id: "descricao",
    title: "2. Descrição do Serviço",
    content: (
      <>
        <p>
          A Amore Mio é uma plataforma de organização financeira pessoal que
          permite registrar e acompanhar dívidas, receitas, pagamentos,
          recebimentos, cartões de crédito, categorias, extratos, metas
          financeiras e contribuições, além de oferecer previsão financeira,
          comparativos entre períodos, um indicador de saúde financeira,
          lembretes de vencimento e exportação de relatórios em PDF e Excel.
        </p>
        <p>
          <strong>
            A Amore Mio não é uma instituição financeira, não realiza transações
            bancárias e não presta consultoria ou assessoria financeira,
            contábil, tributária ou de investimentos.
          </strong>{" "}
          Todo o conteúdo é baseado nos dados que você mesmo cadastra e serve
          apenas como ferramenta de organização e visualização — as decisões
          financeiras são sempre de sua exclusiva responsabilidade.
        </p>
      </>
    ),
  },
  {
    id: "cadastro",
    title: "3. Cadastro e Conta",
    content: (
      <>
        <p>
          Para usar a Amore Mio você precisa de uma conta de acesso com usuário
          e senha, fornecida pela administração. Você é responsável por manter
          suas credenciais em sigilo e por todas as atividades realizadas na sua
          conta.
        </p>
        <p>
          As informações fornecidas no cadastro devem ser verdadeiras, completas
          e mantidas atualizadas. A Amore Mio pode suspender ou encerrar contas
          com informações falsas ou uso indevido da plataforma.
        </p>
      </>
    ),
  },
  {
    id: "planos",
    title: "4. Planos, Período de Teste e Pagamento",
    content: (
      <>
        <p>
          A Amore Mio oferece um plano gratuito com funcionalidades limitadas e
          um plano Pro, pago mensal ou anualmente, que pode incluir um período
          de teste gratuito antes da primeira cobrança. Os pagamentos do plano
          Pro são processados por um parceiro de pagamentos (Asaas) — a Amore
          Mio não armazena os dados completos do seu cartão de crédito.
        </p>
        <p>
          Você pode cancelar a assinatura do plano Pro a qualquer momento pela
          própria plataforma. O cancelamento interrompe as cobranças futuras; o
          acesso aos recursos Pro permanece disponível até o fim do período já
          pago, conforme detalhado na tela de cancelamento no momento da
          solicitação.
        </p>
        <p>
          Atrasos ou falhas no pagamento podem resultar na suspensão automática
          dos recursos exclusivos do plano Pro, com retorno da conta ao plano
          gratuito.
        </p>
      </>
    ),
  },
  {
    id: "programa-indicacoes",
    title: "5. Programa de Indicações",
    content: (
      <>
        <p>
          A Amore Mio pode oferecer um programa de indicações: ao compartilhar
          seu código pessoal, você pode acumular créditos em dinheiro quando
          amigos indicados assinam e pagam o plano Pro. Os valores de crédito
          por indicação, o valor mínimo para saque e o prazo de confirmação
          vigentes são sempre exibidos na tela de Indicações dentro da
          plataforma.
        </p>
        <p>
          Um crédito só é gerado após a primeira cobrança do indicado ser
          efetivamente confirmada, e fica em confirmação por um período antes de
          se tornar disponível para saque. Se o pagamento do indicado for
          reembolsado ou estornado dentro desse período, o crédito
          correspondente é cancelado.
        </p>
        <p>
          Os saques são solicitados por você e pagos via Pix, na chave informada
          no momento da solicitação — você é responsável por garantir que a
          chave Pix fornecida é válida e pertence a você. A Amore Mio pode
          recusar, reverter ou cancelar créditos obtidos por meio de fraude,
          contas duplicadas, indicações fictícias ou qualquer uso indevido do
          programa.
        </p>
        <p>
          A Amore Mio pode alterar as regras, os valores ou encerrar o programa
          de indicações a qualquer momento, respeitando os saldos já disponíveis
          para saque no momento da alteração.
        </p>
      </>
    ),
  },
  {
    id: "uso-adequado",
    title: "6. Uso Adequado da Plataforma",
    content: (
      <p>
        Você concorda em não utilizar a Amore Mio para fins ilícitos, em não
        tentar acessar contas de outros usuários, não realizar engenharia
        reversa, não sobrecarregar ou tentar comprometer a segurança dos nossos
        sistemas, e em respeitar o limite de uso do canal de suporte (uma
        mensagem por dia por usuário).
      </p>
    ),
  },
  {
    id: "propriedade-intelectual",
    title: "7. Propriedade Intelectual",
    content: (
      <p>
        A marca Amore Mio, o layout, o código-fonte, os textos e os demais
        elementos da plataforma são de propriedade da Amore Mio e protegidos por
        lei. Os dados financeiros que você cadastra continuam sendo seus — a
        Amore Mio apenas os processa para fornecer o serviço, conforme descrito
        na Política de Privacidade.
      </p>
    ),
  },
  {
    id: "responsabilidade",
    title: "8. Limitação de Responsabilidade",
    content: (
      <p>
        A Amore Mio se esforça para manter a plataforma disponível e os cálculos
        (previsões, saúde financeira, comparativos) corretos, mas não garante
        disponibilidade ininterrupta nem se responsabiliza por decisões
        financeiras tomadas com base nas informações exibidas. Em caso de
        divergência, os documentos e extratos oficiais das suas instituições
        financeiras sempre prevalecem sobre os dados exibidos na plataforma.
      </p>
    ),
  },
  {
    id: "alteracoes-servico",
    title: "9. Alterações e Interrupção do Serviço",
    content: (
      <p>
        A Amore Mio pode adicionar, alterar ou remover funcionalidades a
        qualquer momento, buscando sempre preservar a integridade dos dados já
        cadastrados. Em caso de descontinuação definitiva do serviço, você será
        avisado com antecedência razoável pelo e-mail cadastrado.
      </p>
    ),
  },
  {
    id: "encerramento",
    title: "10. Encerramento de Conta",
    content: (
      <p>
        Você pode solicitar o encerramento da sua conta a qualquer momento
        entrando em contato pelo canal de suporte. A Amore Mio pode suspender ou
        encerrar contas que violem estes Termos, mediante aviso prévio sempre
        que possível.
      </p>
    ),
  },
  {
    id: "alteracoes-termos",
    title: "11. Alterações nestes Termos",
    content: (
      <p>
        Estes Termos podem ser atualizados periodicamente. Alterações materiais
        serão comunicadas e poderão exigir um novo aceite antes que você
        continue usando a plataforma. A data da versão vigente é exibida no
        início desta página.
      </p>
    ),
  },
  {
    id: "lei-aplicavel",
    title: "12. Lei Aplicável e Foro",
    content: (
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil.
        Fica eleito o foro do domicílio do usuário para dirimir eventuais
        controvérsias, salvo disposição legal em contrário.
      </p>
    ),
  },
  {
    id: "contato-termos",
    title: "13. Contato",
    content: (
      <p>
        Dúvidas sobre estes Termos de Uso podem ser enviadas para{" "}
        <strong>contato.amoremiobr@gmail.com</strong> ou pelo canal de suporte
        dentro da plataforma.
      </p>
    ),
  },
];

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    id: "controlador",
    title: "1. Controlador dos Dados",
    content: (
      <p>
        A Amore Mio é a controladora dos dados pessoais tratados por meio da
        plataforma, nos termos da Lei Geral de Proteção de Dados (Lei nº
        13.709/2018 — LGPD). Para qualquer assunto relacionado à privacidade dos
        seus dados, entre em contato pelo e-mail{" "}
        <strong>contato.amoremiobr@gmail.com</strong>.
      </p>
    ),
  },
  {
    id: "dados-coletados",
    title: "2. Dados que Coletamos",
    content: (
      <>
        <p>
          <strong>Dados de cadastro:</strong> nome, e-mail e nome de usuário.
        </p>
        <p>
          <strong>Dados financeiros inseridos por você:</strong> dívidas,
          receitas, pagamentos, recebimentos, cartões de crédito, categorias,
          metas financeiras e contribuições cadastradas voluntariamente para uso
          da plataforma.
        </p>
        <p>
          <strong>Dados de pagamento:</strong> ao assinar o plano Pro, os dados
          de cobrança são processados diretamente pelo nosso parceiro de
          pagamentos (Asaas); a Amore Mio recebe apenas a confirmação do
          pagamento e o status da assinatura, nunca o número completo do cartão.
        </p>
        <p>
          <strong>Dados de indicação e saque:</strong> seu código de indicação
          e, quando você solicita o saque do saldo do programa de indicações, a
          chave Pix informada por você, usada exclusivamente para processar essa
          transferência.
        </p>
        <p>
          <strong>Dados técnicos e de auditoria:</strong> endereço IP,
          identificador do navegador (user agent) e data/hora, coletados
          automaticamente em eventos como login e aceite destes Termos, para
          fins de segurança e auditoria.
        </p>
      </>
    ),
  },
  {
    id: "finalidade",
    title: "3. Finalidade e Base Legal do Tratamento",
    content: (
      <>
        <p>
          Utilizamos seus dados para: (i) viabilizar as funcionalidades da
          plataforma (execução do contrato, art. 7º, V da LGPD); (ii) processar
          pagamentos do plano Pro (execução do contrato); (iii) enviar
          notificações operacionais por e-mail, como confirmações de assinatura,
          lembretes de vencimento e respostas do suporte (execução do contrato e
          legítimo interesse, art. 7º, IX); e (iv) manter registros de segurança
          e auditoria, como o aceite destes Termos (cumprimento de obrigação
          legal e legítimo interesse).
        </p>
      </>
    ),
  },
  {
    id: "compartilhamento",
    title: "4. Compartilhamento com Terceiros",
    content: (
      <>
        <p>
          Não vendemos seus dados pessoais. Compartilhamos dados apenas com
          prestadores de serviço estritamente necessários para o funcionamento
          da plataforma, sempre no limite necessário para cada finalidade:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Asaas</strong> — processamento de pagamentos e cobranças do
            plano Pro, e transferências via Pix para saques do programa de
            indicações.
          </li>
          <li>
            <strong>Provedor de e-mail transacional (Brevo)</strong> — envio de
            e-mails operacionais (confirmações, lembretes, respostas de
            suporte).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "retencao",
    title: "5. Retenção de Dados",
    content: (
      <p>
        Mantemos seus dados enquanto sua conta estiver ativa e pelo prazo
        adicional necessário para cumprir obrigações legais, resolver disputas
        ou fazer valer nossos acordos. Registros de auditoria, como o aceite
        destes Termos, são mantidos mesmo após o encerramento da conta, pelo
        tempo necessário para fins de comprovação legal.
      </p>
    ),
  },
  {
    id: "seguranca",
    title: "6. Segurança dos Dados",
    content: (
      <p>
        Adotamos medidas técnicas e organizacionais para proteger seus dados,
        como senhas armazenadas de forma criptografada, conexões seguras (HTTPS)
        e controle de acesso por permissões. Nenhum sistema é totalmente livre
        de riscos; caso identifiquemos um incidente de segurança relevante, você
        será notificado conforme exigido pela LGPD.
      </p>
    ),
  },
  {
    id: "direitos",
    title: "7. Seus Direitos como Titular de Dados",
    content: (
      <>
        <p>
          Nos termos do art. 18 da LGPD, você pode solicitar a qualquer momento:
          confirmação da existência de tratamento, acesso aos seus dados,
          correção de dados incompletos ou desatualizados, anonimização ou
          eliminação de dados desnecessários, portabilidade dos dados,
          informação sobre com quem compartilhamos seus dados, e revogação do
          consentimento, quando aplicável.
        </p>
        <p>
          Para exercer qualquer desses direitos, entre em contato pelo e-mail{" "}
          <strong>contato.amoremiobr@gmail.com</strong>.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "8. Cookies e Tecnologias Semelhantes",
    content: (
      <p>
        Utilizamos cookies e armazenamento local estritamente necessários para
        manter sua sessão autenticada e lembrar suas preferências de uso. Não
        utilizamos cookies de rastreamento publicitário de terceiros.
      </p>
    ),
  },
  {
    id: "alteracoes-politica",
    title: "9. Alterações nesta Política",
    content: (
      <p>
        Esta Política pode ser atualizada periodicamente para refletir mudanças
        na plataforma ou na legislação. Alterações materiais poderão exigir um
        novo aceite antes que você continue usando a plataforma. A data da
        versão vigente é exibida no início desta página.
      </p>
    ),
  },
  {
    id: "contato-privacidade",
    title: "10. Contato",
    content: (
      <p>
        Para dúvidas, solicitações ou reclamações relacionadas à sua privacidade
        e aos seus dados pessoais, entre em contato pelo e-mail{" "}
        <strong>contato.amoremiobr@gmail.com</strong>.
      </p>
    ),
  },
];

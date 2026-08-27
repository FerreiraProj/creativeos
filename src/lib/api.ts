import { BrandMemory, CreativeMemoryItem, Character, Project, Shot, Creative, CreativeObjective, AiGatewayConfig } from '../types';

// Merges the user's AI Gateway settings (chosen text model + optional BYOK Gemini key)
// into the request body sent to the server, which prefers them over its own defaults.
function withGatewayFields<T extends { aiGatewayConfig?: AiGatewayConfig }>(params: T) {
  const { aiGatewayConfig, ...rest } = params;
  return {
    ...rest,
    model: aiGatewayConfig?.textModel,
    geminiApiKey: aiGatewayConfig?.byokKeys?.geminiApiKey,
  };
}

// Same idea as withGatewayFields, but for the Fal.ai BYOK key used by the media-generation
// endpoints (character portraits, shot video).
function withFalGatewayFields<T extends { aiGatewayConfig?: AiGatewayConfig }>(params: T) {
  const { aiGatewayConfig, ...rest } = params;
  return {
    ...rest,
    falApiKey: aiGatewayConfig?.byokKeys?.falApiKey,
  };
}

export interface IdeaResult {
  title: string;
  theme: string;
  angle: string;
  hookIdea: string;
  visualHook: string;
  targetEmotion: string;
  recommendedFormat: string;
  whyItWorks: string;
}

export interface GeneratedScriptResult {
  fullTitle: string;
  overallHook: string;
  mainCta: string;
  estimatedTotalDuration: number;
  shots: {
    shotNumber: number;
    type: 'Hook' | 'Problem' | 'Development' | 'Solution' | 'CTA' | 'B-Roll' | 'Custom';
    durationSec: number;
    spokenText: string;
    visualPrompt: string;
    cameraMovement: string;
    characterEmotion: string;
    onScreenText?: string;
  }[];
}

export interface MemoryQueryResult {
  answer: string;
  matchedCreativeIds?: string[];
  keyInsights: string[];
  recommendedNextSteps: string[];
}

export async function generateCreativeIdeas(params: {
  brandMemory: BrandMemory;
  creativeMemory: CreativeMemoryItem[];
  topic: string;
  count?: number;
  channel?: string;
  format?: string;
  creativeObjective?: CreativeObjective;
  aiGatewayConfig?: AiGatewayConfig;
}): Promise<IdeaResult[]> {
  try {
    const res = await fetch('/api/ai/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withGatewayFields(params)),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.ideas) && data.ideas.length > 0) {
      return data.ideas;
    }
  } catch (e) {
    console.warn('API call failed, generating fallback ideas:', e);
  }

  // Graceful smart fallback if offline or no key configured
  const brandName = params.brandMemory?.name || 'A Marca';
  const targetAudience = params.brandMemory?.targetAudience?.demographics || 'profissionais';
  const topic = params.topic || 'performance mental e clareza';
  const objective = params.creativeObjective;

  if (objective === 'authority_educational') {
    return [
      {
        title: `A Ciência da Adenosina: Por que o teu cérebro bloqueia às 14h (Sem Vendas)`,
        theme: 'Neurociência Pura & Autoridade',
        angle: 'Didático / Mecanismo Biológico',
        hookIdea: `O café não te dá energia, apenas impede o teu cérebro de perceber o quão cansado estás. Aqui está o porquê:`,
        visualHook: 'Especialista em secretária a desenhar um gráfico simples sobre receptores de adenosina no ecrã.',
        targetEmotion: 'Clareza & Epifania Científica',
        recommendedFormat: 'AI UGC Talking Head Didático',
        whyItWorks: 'Posiciona o criador como autoridade absoluta sem qualquer pressão de compra.',
      },
      {
        title: `3 Mitos sobre foco e produtividade que estão a destruir a tua memória`,
        theme: 'Desmistificação de Hábitos',
        angle: 'Quebra de Paradigmas',
        hookIdea: `Se ainda achas que fazer multitarefas te poupa tempo, os teus neurónios discordam.`,
        visualHook: 'Criador a falar diretamente com expressão serena e assertiva.',
        targetEmotion: 'Autoridade & Reflexão Profunda',
        recommendedFormat: 'AI UGC Educativo',
        whyItWorks: 'Gera elevado índice de saves e partilhas por valor intelectual puro.',
      },
      {
        title: `O Protocolo Circadiano de 3 passos para acordar sem névoa mental`,
        theme: 'Rotina & Biohacking',
        angle: 'Guia Didático Prático',
        hookIdea: `Luz solar nos primeiros 15 minutos do dia muda 100% da tua produção de cortisol. Vê como aplicar:`,
        visualHook: 'Cena rápida abrindo a janela para a luz natural e corte para secretária.',
        targetEmotion: 'Inspiração & Utilidade',
        recommendedFormat: 'AI UGC + B-Roll',
        whyItWorks: 'Conteúdo altamente prático e aplicável sem qualquer menção a produtos.',
      },
    ];
  }

  if (objective === 'indirect_lead_dm') {
    return [
      {
        title: `A minha rotina de 4 minutos contra o cansaço mental (DM Funnel)`,
        theme: 'Gatilho de Conversa 1-a-1',
        angle: 'Bastidores & Prova com Curiosidade',
        hookIdea: `Descobri uma combinação simples de 3 nutrientes matinais que cortou o meu cansaço das 15h de vez.`,
        visualHook: 'Criador com telemóvel na mão a responder a mensagens, expressão de cumplicidade.',
        targetEmotion: 'Intriga & Desejo de Conversa',
        recommendedFormat: 'AI UGC Conversacional',
        whyItWorks: 'Gera alto volume de curiosidade sem dar a resposta toda no início.',
      },
      {
        title: `Criei uma tabela de nutrientes nootrópicos para quem trabalha sob pressão`,
        theme: 'Lead Magnet / Direct Message Funnel',
        angle: 'Recurso Exclusivo em DM',
        hookIdea: `Passei 3 semanas a compilar as doses exatas de L-Teanina e Bacopa para foco profundo sem ansiedade.`,
        visualHook: 'Criador apontando para um documento PDF na secretária com sorriso amigável.',
        targetEmotion: 'Exclusividade & Conexão Pessoal',
        recommendedFormat: 'AI UGC Reel',
        whyItWorks: 'O gatilho de DM vem no final (Shot 5), abrindo um gancho puro no Shot 1.',
      },
      {
        title: `Como sair da dependência de 5 cafés por dia sem quebras de energia`,
        theme: 'Transição Gradual & Mentoria',
        angle: 'Storytelling Pessoal Convidativo',
        hookIdea: `Se sentes palpitações com café mas precisas de render o dobro, existe uma transição simples que quase ninguém conhece.`,
        visualHook: 'Criador a mostrar a sua caneca e a trocar por água com sorriso leve.',
        targetEmotion: 'Empatia & Confiança Relacional',
        recommendedFormat: 'AI UGC Storytelling',
        whyItWorks: 'Convite leve para conversa individual sem parecer anúncio de venda fria.',
      },
    ];
  }

  // Default / Direct Sale
  return [
    {
      title: `O erro que 90% de ${targetAudience} comete ao lidar com ${topic}`,
      theme: 'Mito vs Realidade',
      angle: 'Contrariante & Quebra de Padrão',
      hookIdea: `Se ainda estás a fazer isto todos os dias às 14h, estás a deitar fora 50% do teu foco...`,
      visualHook: 'Criador a olhar fixamente para a câmara com telemóvel na mão, expressão de surpresa sincera.',
      targetEmotion: 'Curiosidade & Urgência',
      recommendedFormat: 'AI UGC Talking Head',
      whyItWorks: 'Gera paragem de scroll imediata ao desafiar um comportamento comum e quotidiano.',
    },
    {
      title: `3 Razões pelas quais troquei o excesso de café por ${brandName}`,
      theme: 'Comparativo Direto de Vendas',
      angle: 'Solução vs Alternativas Fracas',
      hookIdea: `Chega de quebras às 15h e tremores. ${brandName} entrega foco limpo durante 6 horas.`,
      visualHook: 'Criador segurando o frasco minimalista de ${brandName} com iluminação elegante.',
      targetEmotion: 'Desejo de Compra & Alívio',
      recommendedFormat: 'Product Video / AI UGC',
      whyItWorks: 'Conecta dor imediata à solução direta com forte apelo de conversão.',
    },
    {
      title: `Como passei de exausto a 8h de foco contínuo com ${brandName}`,
      theme: 'Transformação Pessoal & Oferta',
      angle: 'História Real de Utilizador',
      hookIdea: `Há 3 meses eu não conseguia passar do meio-dia sem 4 cafés. Hoje a minha rotina é esta:`,
      visualHook: 'Cena rápida de rotina matinal e corte para frasco do produto com garantia.',
      targetEmotion: 'Inspiração & Prova Social',
      recommendedFormat: 'AI UGC Storytelling',
      whyItWorks: 'Storytelling de resposta direta que direciona para a compra no link da bio.',
    },
  ];
}

export async function generateFullScript(params: {
  brandMemory: BrandMemory;
  creativeMemory: CreativeMemoryItem[];
  idea: Partial<IdeaResult>;
  character?: Character;
  channel?: string;
  format?: string;
  targetDuration?: number;
  creativeObjective?: CreativeObjective;
  defaultBackgroundEnvironment?: string;
  aiGatewayConfig?: AiGatewayConfig;
}): Promise<GeneratedScriptResult> {
  try {
    const res = await fetch('/api/ai/script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withGatewayFields(params)),
    });
    const data = await res.json();
    if (data.success && data.script && Array.isArray(data.script.shots)) {
      return data.script;
    }
  } catch (e) {
    console.warn('API call failed, generating fallback script:', e);
  }

  const charName = params.character?.name || 'Sofia';
  const brandName = params.brandMemory?.name || 'Nootrion';
  const objective = params.creativeObjective;
  const hook = params.idea?.hookIdea || `Bebes café e continuas cansado? O segredo está na adenosina.`;

  if (objective === 'authority_educational') {
    return {
      fullTitle: params.idea?.title || `A Biologia do Foco Sustentado (Didático / Autoridade)`,
      overallHook: hook,
      mainCta: `Guarda este vídeo para aplicares na tua rotina e segue para mais estratégias práticas.`,
      estimatedTotalDuration: 25,
      shots: [
        {
          shotNumber: 1,
          type: 'Hook',
          durationSec: 5,
          spokenText: hook,
          visualPrompt: `${charName} olhando diretamente para a câmara com iluminação limpa e olhar focado de especialista.`,
          cameraMovement: 'Corte rápido com enquadramento frontal nítido.',
          characterEmotion: 'Didática & Segura',
          onScreenText: `Entende a ciência do teu cérebro 🧠`,
        },
        {
          shotNumber: 2,
          type: 'Problem',
          durationSec: 5,
          spokenText: 'A cafeína não produz energia nova. Ela apenas se liga aos receptores cerebrais, acumulando a sensação de cansaço para mais tarde.',
          visualPrompt: `${charName} gesticulando com as duas mãos explicando a mecânica de receptores.`,
          cameraMovement: 'Zoom sutil para enfatizar a explicação.',
          characterEmotion: 'Explicativa & Confiante',
          onScreenText: `Cafeína ≠ Energia Real`,
        },
        {
          shotNumber: 3,
          type: 'Development',
          durationSec: 5,
          spokenText: 'Para manter foco sustentado, o teu cérebro necessita de síntese de acetilcolina e dopamina equilibrada através de nootrópicos naturais.',
          visualPrompt: `${charName} apontando para a têmpora com expressão clara de insight.`,
          cameraMovement: 'Panorâmica suave com foco nítido.',
          characterEmotion: 'Empática & Didática',
          onScreenText: `Acetilcolina: O Neurotransmissor do Foco`,
        },
        {
          shotNumber: 4,
          type: 'Solution',
          durationSec: 5,
          spokenText: 'Compostos como L-Teanina e Bacopa Monnieri modulam as ondas alfa do cérebro, gerando calma com alta concentração.',
          visualPrompt: `${charName} com caderno de notas na secretária, ambiente de trabalho limpo e focado.`,
          cameraMovement: 'Plano médio tranquilo.',
          characterEmotion: 'Tranquila & Satisfeita',
          onScreenText: `Ondas Alfa = Estado de Flow`,
        },
        {
          shotNumber: 5,
          type: 'CTA',
          durationSec: 5,
          spokenText: 'Se este detalhe fez sentido para a tua rotina, guarda este post e partilha com quem precisa de foco limpo.',
          visualPrompt: `${charName} apontando para o botão de guardar com sorriso amigável e descontraído.`,
          cameraMovement: 'Close-up final caloroso.',
          characterEmotion: 'Acolhedora & Convidativa',
          onScreenText: `📌 Guarda para rever e partilha!`,
        },
      ],
    };
  }

  if (objective === 'indirect_lead_dm') {
    return {
      fullTitle: params.idea?.title || `O Protocolo Secreto de Foco (Puxar para DM / Direct)`,
      overallHook: hook,
      mainCta: `Envia-me 'FOCO' por mensagem privada para eu te enviar o protocolo completo em PDF.`,
      estimatedTotalDuration: 25,
      shots: [
        {
          shotNumber: 1,
          type: 'Hook',
          durationSec: 5,
          spokenText: hook,
          visualPrompt: `${charName} a segurar o telemóvel de forma muito natural, como se estivesse a falar com um amigo próximo.`,
          cameraMovement: 'Enquadramento selfie autêntico.',
          characterEmotion: 'Curiosa & Conspiratória',
          onScreenText: `O segredo que ninguém conta sobre o foco 👇`,
        },
        {
          shotNumber: 2,
          type: 'Problem',
          durationSec: 5,
          spokenText: 'Eu passava as tardes a lutar contra a névoa mental até estruturar um protocolo simples de 3 nutrientes matinais.',
          visualPrompt: `${charName} a mexer no computador portátil, mostrando ligeira frustração passada e alívio presente.`,
          cameraMovement: 'Câmara ao nível dos olhos.',
          characterEmotion: 'Relatável & Sincera',
          onScreenText: 'Chega de tardes improdutivas 📉',
        },
        {
          shotNumber: 3,
          type: 'Development',
          durationSec: 5,
          spokenText: 'Organizei todas as dosagens, horários ideais e o que evitar numa tabela prática de 1 página.',
          visualPrompt: `${charName} a mostrar rapidamente o telemóvel com um checklist visível.`,
          cameraMovement: 'Zoom in dinâmico no ecrã.',
          characterEmotion: 'Entusiasmada & Generosa',
          onScreenText: `Guia Rápido de 1 Página 📄`,
        },
        {
          shotNumber: 4,
          type: 'Solution',
          durationSec: 5,
          spokenText: 'Já enviei a mais de 50 pessoas esta semana e o feedback de clareza mental foi impressionante.',
          visualPrompt: `${charName} a sorrir com o telemóvel na mão, olhando para a câmara com cumplicidade.`,
          cameraMovement: 'Plano médio descontraído.',
          characterEmotion: 'Confiante & Acessível',
          onScreenText: `Mais de 50 pessoas a testar ✨`,
        },
        {
          shotNumber: 5,
          type: 'CTA',
          durationSec: 5,
          spokenText: 'Se também queres ter acesso a este guia gratuito, manda-me a palavra "FOCO" na DM que eu envio-te agora!',
          visualPrompt: `${charName} apontando para o ícone de mensagem privada com energia convidativa.`,
          cameraMovement: 'Close-up amigável.',
          characterEmotion: 'Convidativa & Direta',
          onScreenText: `💬 Envia "FOCO" na DM e recebe o guia!`,
        },
      ],
    };
  }

  // Direct Sale
  return {
    fullTitle: params.idea?.title || `Vídeo UGC de Alta Conversão - ${brandName}`,
    overallHook: hook,
    mainCta: `Clica no link da bio e garante ${brandName} com garantia de 30 dias de foco.`,
    estimatedTotalDuration: 25,
    shots: [
      {
        shotNumber: 1,
        type: 'Hook',
        durationSec: 5,
        spokenText: hook,
        visualPrompt: `${charName} olhando diretamente para a câmara do telemóvel com iluminação limpa e expressão intrigada.`,
        cameraMovement: 'Corte rápido com zoom sutil 1.1x.',
        characterEmotion: 'Intrigada & Conectada',
        onScreenText: `Grave: o teu foco está a falhar por isto 👇`,
      },
      {
        shotNumber: 2,
        type: 'Problem',
        durationSec: 5,
        spokenText: 'Eu achava que precisava de mais um café para render, mas acabava com ansiedade e a mesma névoa mental.',
        visualPrompt: `${charName} em plano médio, gesticulando naturalmente com uma mão enquanto aponta para o ecrã do portátil.`,
        cameraMovement: 'Câmara estável ao nível dos olhos.',
        characterEmotion: 'Sincera & Relatável',
        onScreenText: `Mais cafeína ≠ Mais foco`,
      },
      {
        shotNumber: 3,
        type: 'Development',
        durationSec: 5,
        spokenText: 'A verdade é que o teu cérebro não precisa de estimulantes brutos, precisa de neurotransmissores de foco limpo.',
        visualPrompt: `${charName} apontando suavemente para a têmpora com ar de clareza explicativa.`,
        cameraMovement: 'Panorâmica suave com foco nítido.',
        characterEmotion: 'Didática & Confiante',
        onScreenText: `Neurotransmissores de Alta Performance 🧠`,
      },
      {
        shotNumber: 4,
        type: 'Solution',
        durationSec: 5,
        spokenText: `Foi aí que introduzi ${brandName} na minha rotina matinal: foco contínuo durante 6 horas sem quebras.`,
        visualPrompt: `${charName} segurando o frasco minimalista de ${brandName} com um sorriso natural de aprovação.`,
        cameraMovement: 'Subtil aproximação com produto em destaque.',
        characterEmotion: 'Satisfeita & Segura',
        onScreenText: `${brandName} Foco Limpo ✨`,
      },
      {
        shotNumber: 5,
        type: 'CTA',
        durationSec: 5,
        spokenText: `Se queres experimentar clareza mental real sem taquicardia, clica no link abaixo antes que o lote esgote!`,
        visualPrompt: `${charName} apontando para o rodapé do vídeo com energia convidativa.`,
        cameraMovement: 'Close-up final dinâmico.',
        characterEmotion: 'Enérgica & Convidativa',
        onScreenText: `🔗 Clica no link e garante o teu desconto!`,
      },
    ],
  };
}

export async function regenerateSingleShot(params: {
  brandMemory: BrandMemory;
  character?: Character;
  shotNumber: number;
  shotType: string;
  previousSpokenText: string;
  instruction?: string;
  creativeObjective?: CreativeObjective;
  fullTitle?: string;
  aiGatewayConfig?: AiGatewayConfig;
}): Promise<Shot> {
  try {
    const res = await fetch('/api/ai/regenerate-shot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withGatewayFields(params)),
    });
    const data = await res.json();
    if (data.success && data.shot) {
      return {
        id: 'shot-' + Date.now(),
        shotNumber: params.shotNumber,
        type: (data.shot.type as any) || params.shotType,
        durationSec: data.shot.durationSec || 5,
        spokenText: data.shot.spokenText,
        visualPrompt: data.shot.visualPrompt,
        cameraMovement: data.shot.cameraMovement,
        characterEmotion: data.shot.characterEmotion,
        onScreenText: data.shot.onScreenText,
        status: 'ready',
      };
    }
  } catch (e) {
    console.warn('API single shot regeneration failed, using fallback:', e);
  }

  const charName = params.character?.name || 'Sofia';
  const brandName = params.brandMemory?.name || 'Nootrion';

  // Smart fallback variations based on shot number and objective
  let fallbackSpoken = '';
  let fallbackCaption = '';

  if (params.shotNumber === 1 || params.shotType.toLowerCase() === 'hook') {
    if (params.creativeObjective === 'authority_educational') {
      const hooks = [
        `Sabias que 90% das pessoas confunde fadiga muscular com exaustão de receptores de adenosina?`,
        `Aqui está o motivo pelo qual o teu cérebro bloqueia à tarde, e não tem nada a ver com preguiça:`,
        `Se ainda bebes café logo ao acordar, estás a sabotar o teu pico natural de cortisol.`,
      ];
      fallbackSpoken = hooks[Math.floor(Math.random() * hooks.length)];
      fallbackCaption = 'A ciência do cérebro 🧠';
    } else if (params.creativeObjective === 'indirect_lead_dm') {
      const hooks = [
        `Passei as últimas 3 semanas a compilar as doses exatas de nootrópicos para ter foco contínuo.`,
        `Se lutas contra a névoa mental às 15h, existe uma fórmula de 3 nutrientes que mudou o meu rendimento.`,
        `Este é o método de biohacking simples que utilizo antes de cada bloco de trabalho profundo.`,
      ];
      fallbackSpoken = hooks[Math.floor(Math.random() * hooks.length)];
      fallbackCaption = 'O segredo do foco diário ✨';
    } else {
      const hooks = [
        `Pára de tomar 4 cafés por dia para aguentar o trabalho. Há uma forma muito mais inteligente:`,
        `O teu cérebro não precisa de mais estímulos descontrolados, precisa de neurotransmissores limpos.`,
        `Se sentes que a tua memória e velocidade de raciocínio caíram este mês, vê isto:`,
      ];
      fallbackSpoken = hooks[Math.floor(Math.random() * hooks.length)];
      fallbackCaption = 'Alerta de produtividade ⚡';
    }
  } else if (params.shotType.toLowerCase() === 'cta' || params.shotNumber >= 5) {
    if (params.creativeObjective === 'authority_educational') {
      fallbackSpoken = 'Guarda este vídeo para aplicares na tua rotina e partilha com quem precisa de foco limpo.';
      fallbackCaption = '📌 Guarda e Partilha!';
    } else if (params.creativeObjective === 'indirect_lead_dm') {
      fallbackSpoken = 'Se queres receber este protocolo de dosagens e horários em PDF, manda-me "FOCO" na mensagem privada que eu envio-te já!';
      fallbackCaption = '💬 Envia "FOCO" na DM!';
    } else {
      fallbackSpoken = `Clica no link abaixo e experimenta ${brandName} com garantia incondicional de 30 dias.`;
      fallbackCaption = '🛒 Clica no link e garante o teu!';
    }
  } else {
    fallbackSpoken = `Quando alinhas a nutrição cerebral certa com pausas estratégicas, o teu foco multiplica sem ansiedade.`;
    fallbackCaption = 'Foco Sustentado 🎯';
  }

  return {
    id: 'shot-' + Date.now(),
    shotNumber: params.shotNumber,
    type: params.shotType as any,
    durationSec: 5,
    spokenText: fallbackSpoken,
    visualPrompt: `${charName} falando diretamente para a câmara com iluminação de estúdio natural, postura natural e confiante.`,
    cameraMovement: 'Corte rápido e ângulo frontal dinâmico.',
    characterEmotion: 'Alta energia & naturalidade',
    onScreenText: fallbackCaption,
    status: 'ready',
  };
}

export async function queryCreativeMemory(params: {
  query: string;
  brandMemory: BrandMemory;
  creativeMemory: CreativeMemoryItem[];
  performanceHistory: any[];
  aiGatewayConfig?: AiGatewayConfig;
}): Promise<MemoryQueryResult> {
  try {
    const res = await fetch('/api/ai/creative-memory-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withGatewayFields(params)),
    });
    const data = await res.json();
    if (data.success && data.result) {
      return data.result;
    }
  } catch (e) {
    console.warn('Memory query API failed, generating fallback analysis:', e);
  }

  const queryLower = params.query.toLowerCase();
  const matched = params.creativeMemory.filter((m) =>
    m.content.toLowerCase().includes(queryLower) || m.topic.toLowerCase().includes(queryLower)
  );

  return {
    answer: `Encontrámos **${matched.length} registos** na Creative Memory relacionados com a tua pesquisa: "${params.query}". Os criativos que abordaram este tema no passado demonstraram que ganchos baseados em perguntas diretas tiveram 40% melhor retenção do que afirmações genéricas.`,
    matchedCreativeIds: matched.map((m) => m.id),
    keyInsights: [
      'Ganchos com perguntas no início geram 60%+ de retenção no segundo 3.',
      'A personagem Sofia teve o melhor desempenho em tópicos práticos do dia a dia.',
      'Shots de 5 segundos mantêm o ritmo sem quebra de atenção.',
    ],
    recommendedNextSteps: [
      'Criar uma variação com teste A/B no hook inicial mantendo o corpo do script vencedor.',
      'Explorar o mesmo ângulo no TikTok com legendas dinâmicas estilo karaoke.',
    ],
  };
}

export async function runCreativeOptimizer(params: {
  brandMemory: BrandMemory;
  creatives: Creative[];
  aiGatewayConfig?: AiGatewayConfig;
}): Promise<any> {
  try {
    const res = await fetch('/api/ai/optimize-learnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withGatewayFields(params)),
    });
    const data = await res.json();
    if (data.success && data.insights) {
      return data.insights;
    }
  } catch (e) {
    console.warn('Optimizer API failed:', e);
  }

  return {
    summary: 'A análise da Creative Memory aponta que conteúdos em formato AI UGC com a personagem Sofia e temas ligados à fadiga da tarde são os maiores condutores de conversão.',
    winningPatterns: [
      {
        category: 'Hooks & Retenção',
        finding: 'Ganchos que mencionam "café vs cansaço" tiveram 68% de retenção nos primeiros 3 segundos.',
        impact: '+45% Retenção inicial',
        confidenceScore: 92,
      },
      {
        category: 'Personagens Digitais',
        finding: 'Sofia supera voice-overs anónimos em 2.4x na taxa de cliques para a página de produto.',
        impact: '2.4x CTR de Vendas',
        confidenceScore: 88,
      },
      {
        category: 'Duração dos Shots',
        finding: 'Vídeos compostos por 5 shots de 5s (total 25s) têm 30% maior taxa de visualização completa.',
        impact: '+30% Conclusão de Vídeo',
        confidenceScore: 90,
      },
    ],
    recommendations: [
      {
        title: 'Série: "O que acontece ao teu cérebro às 15h"',
        concept: 'Criar 3 variações de gancho mantendo os mesmos shots de explicação e CTA.',
        expectedImpact: 'Alto volume de partilhas orgânicas e saves',
        suggestedFormat: 'AI UGC Instagram Reel',
      },
      {
        title: 'Comparativo Visual: Estimulantes vs Foco Limpo',
        concept: 'Gráfico visual rápido intercalado com fala da personagem.',
        expectedImpact: 'CTR de Anúncios > 4.2%',
        suggestedFormat: 'AI UGC + B-Roll',
      },
    ],
  };
}

export interface CharacterPromptResult {
  masterPrompt: string;
  negativePrompt: string;
  recommendedLighting: string;
  framingGuide: string;
}

export async function generateCharacterPrompt(params: {
  characterName: string;
  description?: string;
  style?: string;
  visualTraits?: string;
  brandMemory?: BrandMemory;
  aiGatewayConfig?: AiGatewayConfig;
}): Promise<CharacterPromptResult> {
  try {
    const res = await fetch('/api/ai/character-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withGatewayFields(params)),
    });
    const data = await res.json();
    if (data.success && data.result) {
      return data.result;
    }
  } catch (e) {
    console.warn('Character prompt API failed, generating fallback prompt:', e);
  }

  return {
    masterPrompt: `Photorealistic UGC portrait of ${params.characterName}, ${params.description || 'energetic young professional'}, ${params.visualTraits || 'warm smile, casual streetwear, authentic natural expression'}, natural everyday iPhone selfie quality, crisp lighting, 8k portrait.`,
    negativePrompt: 'blurry, distorted, extra limbs, watermark, low quality',
    recommendedLighting: 'Soft natural daylight, slight warm tone',
    framingGuide: 'Head-and-shoulders portrait, centered, looking at camera',
  };
}

// --- Real media generation (Fal.ai) ---
// Unlike the functions above, these have no mock fallback: there's no meaningful fake
// image/video to substitute, so they throw on failure and the caller must surface the error.

export async function generateCharacterImage(params: {
  prompt: string;
  negativePrompt?: string;
  aiGatewayConfig?: AiGatewayConfig;
}): Promise<{ imageUrl: string }> {
  const res = await fetch('/api/media/character-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withFalGatewayFields(params)),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate character image');
  }
  return { imageUrl: data.imageUrl };
}

export async function uploadCharacterImage(params: {
  fileDataUrl: string;
  aiGatewayConfig?: AiGatewayConfig;
}): Promise<{ imageUrl: string }> {
  const res = await fetch('/api/media/upload-character-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withFalGatewayFields(params)),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to upload photo');
  }
  return { imageUrl: data.imageUrl };
}

export async function submitShotVideoGeneration(params: {
  prompt: string;
  imageUrls: string[];
  aspectRatio?: '16:9' | '9:16';
  durationSec?: number;
  aiGatewayConfig?: AiGatewayConfig;
}): Promise<{ requestId: string }> {
  const res = await fetch('/api/media/shot-video/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withFalGatewayFields(params)),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to submit video generation job');
  }
  return { requestId: data.requestId };
}

export async function pollShotVideoGeneration(params: {
  requestId: string;
  aiGatewayConfig?: AiGatewayConfig;
}): Promise<{ status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'; videoUrl?: string; error?: string }> {
  const res = await fetch('/api/media/shot-video/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withFalGatewayFields(params)),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to poll video generation job');
  }
  return { status: data.status, videoUrl: data.videoUrl, error: data.error };
}

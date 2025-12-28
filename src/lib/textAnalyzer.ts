import type { TextAnalysis, TutorMessage, Grade, Language } from '@/types/research';

// Detect lists in text (numbered or bulleted)
function detectLists(text: string): boolean {
  const listPatterns = [
    /^\s*[-•*]\s+/gm,           // Bullet points
    /^\s*\d+[.)]\s+/gm,         // Numbered lists
    /^\s*[a-z][.)]\s+/gim,      // Lettered lists
    /primero|segundo|tercero|cuarto|quinto/gi, // Spanish ordinals
    /first|second|third|fourth|fifth/gi,       // English ordinals
  ];
  
  return listPatterns.some(pattern => pattern.test(text));
}

// Detect dates in text
function detectDates(text: string): string[] {
  const datePatterns = [
    /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,  // DD/MM/YYYY or similar
    /\b\d{4}\b/g,                                // Years
    /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+\d{1,4}\b/gi,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,4}\b/gi,
    /\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi,
  ];
  
  const dates: string[] = [];
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  });
  
  return [...new Set(dates)].slice(0, 5); // Return unique dates, max 5
}

// Extract key points from text
function extractKeyPoints(text: string, language: Language): string[] {
  // Split by sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Keywords that indicate important information
  const importanceKeywords = language === 'es' 
    ? ['importante', 'principal', 'clave', 'fundamental', 'esencial', 'destaca', 'significa', 'porque', 'razón', 'resultado']
    : ['important', 'main', 'key', 'essential', 'fundamental', 'because', 'result', 'means', 'therefore', 'significant'];
  
  const keyPoints = sentences
    .filter(s => {
      const lower = s.toLowerCase();
      return importanceKeywords.some(kw => lower.includes(kw)) || s.length > 80;
    })
    .slice(0, 4)
    .map(s => s.trim());
  
  if (keyPoints.length === 0 && sentences.length > 0) {
    return sentences.slice(0, 3).map(s => s.trim());
  }
  
  return keyPoints;
}

// Calculate plagiarism (compare source and paraphrased)
function calculatePlagiarism(source: string, paraphrased: string): number {
  if (!source || !paraphrased) return 0;
  
  const sourceWords = source.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const paraphrasedWords = paraphrased.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  if (paraphrasedWords.length === 0) return 0;
  
  // Check for exact phrase matches (3+ consecutive words)
  const sourceText = source.toLowerCase();
  const phrases = [];
  
  for (let i = 0; i < paraphrasedWords.length - 2; i++) {
    const phrase = paraphrasedWords.slice(i, i + 3).join(' ');
    if (sourceText.includes(phrase)) {
      phrases.push(phrase);
    }
  }
  
  // Count copied words
  const copiedWords = paraphrasedWords.filter(w => sourceWords.includes(w)).length;
  const wordRatio = copiedWords / paraphrasedWords.length;
  const phraseBonus = Math.min(phrases.length * 0.1, 0.3);
  
  return Math.min(wordRatio + phraseBonus, 1);
}

export function analyzeText(text: string, language: Language): TextAnalysis {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const dates = detectDates(text);
  const keyPoints = extractKeyPoints(text, language);
  
  return {
    hasLists: detectLists(text),
    hasDates: dates.length > 0,
    isLongText: wordCount > 150,
    mainIdeas: keyPoints.slice(0, 2),
    keyPoints: keyPoints,
    importantDates: dates,
    wordCount,
    isPlagiarism: false,
    plagiarismPercentage: 0,
  };
}

export function checkPlagiarism(source: string, paraphrased: string): { isPlagiarism: boolean; percentage: number } {
  const percentage = calculatePlagiarism(source, paraphrased);
  return {
    isPlagiarism: percentage > 0.4,
    percentage: Math.round(percentage * 100),
  };
}

// Grade-specific sentence starters
function getGradeStarters(grade: Grade, type: string, language: Language): string[] {
  const starters = {
    es: {
      list: {
        1: ['Me gustó que...', 'Vi que...', 'Hay...'],
        2: ['Aprendí que...', 'Los puntos son...', 'Vi varias cosas como...'],
        3: ['Los puntos más importantes son...', 'Hay varias ideas clave como...', 'Lo más importante es...'],
        4: ['En el texto se mencionan varios aspectos...', 'Los puntos clave incluyen...', 'Se destacan las siguientes ideas...'],
        5: ['El autor presenta múltiples argumentos...', 'Los puntos fundamentales abarcan...', 'Se pueden identificar las siguientes ideas principales...'],
      },
      dates: {
        1: ['Pasó en...', 'Fue en...'],
        2: ['En el año...', 'Primero pasó...', 'Después...'],
        3: ['Las fechas importantes son...', 'Primero, en el año...', 'La historia comienza...'],
        4: ['Cronológicamente, los eventos ocurrieron...', 'En la línea del tiempo...', 'Los hechos históricos incluyen...'],
        5: ['Desde una perspectiva histórica...', 'Los eventos se desarrollaron secuencialmente...', 'El contexto temporal abarca...'],
      },
      long: {
        1: ['Dice que...', 'Trata de...'],
        2: ['La idea es...', 'Habla de...', 'En resumen...'],
        3: ['La idea principal es...', 'En resumen...', 'Lo más importante es...'],
        4: ['El texto argumenta que...', 'La tesis central es...', 'Para sintetizar...'],
        5: ['El autor sostiene que...', 'La premisa fundamental es...', 'En síntesis, el argumento central...'],
      },
      ideas: {
        1: ['Dice que...', 'Es sobre...'],
        2: ['Aprendí que...', 'El texto dice...'],
        3: ['Según lo que leí...', 'El texto nos dice que...', 'Aprendí que...'],
        4: ['El autor explica que...', 'Se puede inferir que...', 'La evidencia sugiere...'],
        5: ['El análisis revela que...', 'Se puede concluir que...', 'La investigación demuestra...'],
      },
      plagiarism: {
        1: ['Yo digo que...', 'Para mí...'],
        2: ['En mis palabras...', 'Yo pienso que...'],
        3: ['En mis propias palabras...', 'Lo que yo entiendo es...', 'Otra forma de decirlo es...'],
        4: ['Parafraseando el contenido...', 'Mi interpretación es...', 'Expresándolo de otra manera...'],
        5: ['Reformulando el concepto...', 'Mi análisis personal indica...', 'Reinterpretando la información...'],
      },
    },
    en: {
      list: {
        1: ['I liked that...', 'I saw that...', 'There is...'],
        2: ['I learned that...', 'The points are...', 'I saw many things like...'],
        3: ['The most important points are...', 'There are key ideas like...', 'The main thing is...'],
        4: ['The text mentions several aspects...', 'Key points include...', 'The following ideas stand out...'],
        5: ['The author presents multiple arguments...', 'The fundamental points encompass...', 'The main ideas can be identified as...'],
      },
      dates: {
        1: ['It happened in...', 'It was in...'],
        2: ['In the year...', 'First it happened...', 'Then...'],
        3: ['The important dates are...', 'First, in the year...', 'The story begins...'],
        4: ['Chronologically, events occurred...', 'On the timeline...', 'Historical facts include...'],
        5: ['From a historical perspective...', 'Events developed sequentially...', 'The temporal context spans...'],
      },
      long: {
        1: ['It says that...', 'It is about...'],
        2: ['The idea is...', 'It talks about...', 'In summary...'],
        3: ['The main idea is...', 'In summary...', 'The most important thing is...'],
        4: ['The text argues that...', 'The central thesis is...', 'To synthesize...'],
        5: ['The author maintains that...', 'The fundamental premise is...', 'In synthesis, the central argument...'],
      },
      ideas: {
        1: ['It says that...', 'It is about...'],
        2: ['I learned that...', 'The text says...'],
        3: ['According to what I read...', 'The text tells us that...', 'I learned that...'],
        4: ['The author explains that...', 'It can be inferred that...', 'The evidence suggests...'],
        5: ['The analysis reveals that...', 'It can be concluded that...', 'The research demonstrates...'],
      },
      plagiarism: {
        1: ['I say that...', 'For me...'],
        2: ['In my words...', 'I think that...'],
        3: ['In my own words...', 'What I understand is...', 'Another way to say it is...'],
        4: ['Paraphrasing the content...', 'My interpretation is...', 'Expressing it differently...'],
        5: ['Reformulating the concept...', 'My personal analysis indicates...', 'Reinterpreting the information...'],
      },
    },
  };
  
  return starters[language][type as keyof typeof starters.es]?.[grade] ?? starters[language][type as keyof typeof starters.es]?.[3] ?? [];
}

// Generate dynamic tutor messages based on analysis
export function generateTutorMessages(
  analysis: TextAnalysis,
  grade: Grade,
  language: Language,
  currentStep: string
): TutorMessage[] {
  const messages: TutorMessage[] = [];
  
  const gradeContext = {
    1: { complexity: 'simple', wordLimit: 30, description: language === 'es' ? 'Para 1º grado' : 'For 1st grade' },
    2: { complexity: 'simple', wordLimit: 50, description: language === 'es' ? 'Para 2º grado' : 'For 2nd grade' },
    3: { complexity: 'moderate', wordLimit: 75, description: language === 'es' ? 'Para 3º grado' : 'For 3rd grade' },
    4: { complexity: 'moderate', wordLimit: 100, description: language === 'es' ? 'Para 4º grado' : 'For 4th grade' },
    5: { complexity: 'advanced', wordLimit: 150, description: language === 'es' ? 'Para 5º grado' : 'For 5th grade' },
  };
  
  const context = gradeContext[grade];
  
  if (language === 'es') {
    // Spanish messages
    if (analysis.hasLists) {
      const itemCount = grade <= 2 ? '2' : '3';
      messages.push({
        id: 'list-tip',
        type: 'tip',
        icon: '📋',
        message: `¡Este texto tiene una lista! ${context.description}: Selecciona ${itemCount} puntos importantes y escríbelos con tus propias palabras.`,
        starters: getGradeStarters(grade, 'list', 'es'),
      });
    }
    
    if (analysis.hasDates && analysis.importantDates.length > 0) {
      messages.push({
        id: 'dates-tip',
        type: 'tip',
        icon: '📅',
        message: `¡Encontré fechas importantes: ${analysis.importantDates.slice(0, 3).join(', ')}! ${context.description}: ${grade <= 2 ? 'Menciona cuándo pasó.' : 'Puedes hacer una línea del tiempo o mencionarlas en orden.'}`,
        starters: getGradeStarters(grade, 'dates', 'es'),
      });
    }
    
    if (analysis.isLongText) {
      messages.push({
        id: 'long-tip',
        type: 'tip',
        icon: '📝',
        message: `Este texto tiene ${analysis.wordCount} palabras. ${context.description}: Intenta resumirlo en ${context.wordLimit} palabras o menos.`,
        starters: getGradeStarters(grade, 'long', 'es'),
      });
    }
    
    if (analysis.keyPoints.length > 0 && !analysis.hasLists) {
      const mainIdea = analysis.mainIdeas[0]?.substring(0, 50) + '...';
      messages.push({
        id: 'ideas-tip',
        type: 'analysis',
        icon: '💡',
        message: `Encontré esta idea principal: "${mainIdea}" ${context.description}: ${grade <= 2 ? 'Cuéntame qué entendiste.' : 'Explícala con tus propias palabras.'}`,
        starters: getGradeStarters(grade, 'ideas', 'es'),
      });
    }
    
    if (analysis.isPlagiarism) {
      messages.push({
        id: 'plagiarism-warning',
        type: 'warning',
        icon: '⚠️',
        message: `¡Alerta! ${analysis.plagiarismPercentage}% de tu texto es muy parecido al original. ¡Cambia las palabras y usa tus propias ideas!`,
        starters: getGradeStarters(grade, 'plagiarism', 'es'),
      });
    }
    
  } else {
    // English messages
    if (analysis.hasLists) {
      const itemCount = grade <= 2 ? '2' : '3';
      messages.push({
        id: 'list-tip',
        type: 'tip',
        icon: '📋',
        message: `This text has a list! ${context.description}: Pick ${itemCount} important points and write them in your own words.`,
        starters: getGradeStarters(grade, 'list', 'en'),
      });
    }
    
    if (analysis.hasDates && analysis.importantDates.length > 0) {
      messages.push({
        id: 'dates-tip',
        type: 'tip',
        icon: '📅',
        message: `I found important dates: ${analysis.importantDates.slice(0, 3).join(', ')}! ${context.description}: ${grade <= 2 ? 'Say when it happened.' : 'You can make a timeline or mention them in order.'}`,
        starters: getGradeStarters(grade, 'dates', 'en'),
      });
    }
    
    if (analysis.isLongText) {
      messages.push({
        id: 'long-tip',
        type: 'tip',
        icon: '📝',
        message: `This text has ${analysis.wordCount} words. ${context.description}: Try to summarize it in ${context.wordLimit} words or less.`,
        starters: getGradeStarters(grade, 'long', 'en'),
      });
    }
    
    if (analysis.keyPoints.length > 0 && !analysis.hasLists) {
      const mainIdea = analysis.mainIdeas[0]?.substring(0, 50) + '...';
      messages.push({
        id: 'ideas-tip',
        type: 'analysis',
        icon: '💡',
        message: `I found this main idea: "${mainIdea}" ${context.description}: ${grade <= 2 ? 'Tell me what you understood.' : 'Explain it in your own words.'}`,
        starters: getGradeStarters(grade, 'ideas', 'en'),
      });
    }
    
    if (analysis.isPlagiarism) {
      messages.push({
        id: 'plagiarism-warning',
        type: 'warning',
        icon: '⚠️',
        message: `Alert! ${analysis.plagiarismPercentage}% of your text is very similar to the original. Change the words and use your own ideas!`,
        starters: getGradeStarters(grade, 'plagiarism', 'en'),
      });
    }
  }
  
  // Add encouragement if no specific tips
  if (messages.length === 0) {
    messages.push({
      id: 'general-tip',
      type: 'encouragement',
      icon: '🌟',
      message: language === 'es' 
        ? `¡Buen texto! ${context.description}: Lee con cuidado y escribe lo que entendiste.`
        : `Good text! ${context.description}: Read carefully and write what you understood.`,
      starters: getGradeStarters(grade, 'ideas', language),
    });
  }
  
  return messages;
}

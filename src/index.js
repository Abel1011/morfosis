//Librerias
marked.setOptions({
  breaks: true, // Permite saltos de línea con un solo retorno
  gfm: true,    // GitHub Flavored Markdown
  sanitize: true // Sanitiza el HTML por seguridad
});

//VARIABLES DE CONFIGURACIÓN
let enabled = true;
let customCommand = '';
let length = 'short';
let systemPrompt = '';
let templatePrompt = '';
let menuTimeout = null;


chrome.storage.sync.get(['enabled', 'customCommand', 'length', 'systemPrompt', 'templatePrompt'], function(result) {
  if (result.enabled !== undefined) {
    enabled = result.enabled;
  }
  if (result.customCommand) {
    customCommand = result.customCommand;
  }
  if (result.length) {
    length = result.length;
  }
  if (result.systemPrompt) {
    systemPrompt = result.systemPrompt;
  }
  if (result.templatePrompt) {
    templatePrompt = result.templatePrompt;
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
      console.log('Plugin enabled:', enabled);
    }
    if (changes.customCommand) {
      customCommand = changes.customCommand.newValue;
      console.log('Custom command updated:', customCommand);
    }
    if (changes.length) {
      length = changes.length.newValue;
      console.log('Summary length updated:', length);
    }
    if (changes.systemPrompt) {
      systemPrompt = changes.systemPrompt.newValue;
      console.log('System prompt updated:', systemPrompt);
    }
    if (changes.templatePrompt) {
      templatePrompt = changes.templatePrompt.newValue;
      console.log('Template prompt updated:', templatePrompt);
    }
  }
});

//VARIABLES GLOBALES DE EJECUCIÓN
let isSelecting = false;
let selectionRect = null;
let currentModal = null;
let currentAction = null;
let position = null

//SE AGREGA ELEMENTOS AL BODY
const menu = document.createElement('div');
menu.id = 'floating-menu';
menu.classList.add('hidden', 'p-2', 'rounded', 'flex', 'space-x-2');
menu.style.zIndex = 9990;
document.body.appendChild(menu);

const suggestionsContainer = document.createElement('div');
suggestionsContainer.id = 'suggestions-container';
suggestionsContainer.classList.add('fixed', 'bottom-0', 'left-0', 'w-full', 'bg-gray-100');
document.body.appendChild(suggestionsContainer);

// BOTONES
const BUTTONS = [
  {
    text: 'Rewrite',
    emoji: '✍️',
    subMenu: [
      {
        text: 'Neutral',
        emoji: '😐',
        action: async (event, modal) => {
          await handleRewrite({}, 'Neutral', modal, event);
        }
      },
      {
        text: 'Formal',
        emoji: '👔',
        action: async (event, modal) => {
          await handleRewrite({
            sharedContext: "Rewrite this text in a formal tone. Do not provide greetings or comments, just rewrite the text in a formal tone. Keep the same number of paragraphs.",
            tone: 'more-formal'
          }, 'Formal', modal, event);
        }
      },
      {
        text: 'Casual',
        emoji: '😎',
        action: async (event, modal) => {
          await handleRewrite({
            sharedContext: "Rewrite this text in a casual tone. Do not provide greetings or comments, just rewrite the text in a casual tone. Keep the same number of paragraphs.",
            tone: 'more-casual'
          }, 'Casual', modal, event);
        }
      },
      {
        text: 'Professional',
        emoji: '👨‍💼',
        action: async (event, modal) => {
          await handleRewrite({
            sharedContext: "Rewrite this text in a professional tone. Do not provide greetings or comments, just rewrite the text in a professional tone. Keep the same number of paragraphs."
          }, 'Professional', modal, event);
        }
      },
      {
        text: 'Academic',
        emoji: '🎓',
        action: async (event, modal) => {
          await handleRewrite({
            sharedContext: "Rewrite this text in an academic tone. Do not provide greetings or comments, just rewrite the text in an academic tone. Keep the same number of paragraphs."
          }, 'Academic', modal, event);
        }
      },
      {
        text: 'Creative',
        emoji: '🎨',
        action: async (event, modal) => {
          await handleRewrite({
            sharedContext: "Rewrite this text in a creative tone. Do not provide greetings or comments, just rewrite the text in a creative tone. Keep the same number of paragraphs."
          }, 'Creative', modal, event);
        }
      },
      {
        text: "Improve readability",
        emoji: '📖',
        action: async (event, modal) => {
          await handleWrite({
            sharedContext: "Improve the readability of this text. Rewrite the text to make it easier to read and understand. Do not provide greetings or comments, just rewrite the text to improve readability. Keep the same number of paragraphs."
          }, "Improve readability", modal, event);
        }
      },
      {
        text: "Shorter",
        emoji: '📝',
        action: async (event, modal) => {
          await handleRewrite({
            sharedContext: "Rewrite this text to make it shorter. Do not provide greetings or comments, just rewrite the text to make it shorter. Reduce the number of paragraphs if necessary.",
            length: 'shorter'
          }, 'Shorter', modal, event);
        }
      },
      {
        text: "Longer",
        emoji: '📏',
        action: async (event, modal) => {
          await handleRewrite({
            sharedContext: "Rewrite this text to make it longer. Do not provide greetings or comments, just rewrite the text to make it longer. Add more details if necessary.",
            length: 'longer'
          }, 'Longer', modal, event);
        }
      },
      {
        text: "Custom Command",
        emoji: '🤖',
        action: async (event, modal) => {
          //Aca analizar si esta bien ya que no estoy seguro si el customCommand siempre va a estar actualizado
          await handleRewrite({
            sharedContext: customCommand
          }, 'Custom Command', modal, event);
        }
      }
    ],
  },
  {
    text: 'Summarize',
    emoji: '📝',
    subMenu: [
      {
        text: 'tl;dr',
        emoji: '👀',
        action: async (event, modal) => {
          await handleSummarize({
            sharedContext: "You are a writer specialized in creative writing and text generation. Your task is to summarize the text in a tl;dr format.",
            context: "Summarize this text in a tl;dr format. Do not provide greetings or comments, just summarize the text in a tl;dr format.",
            type: 'tl;dr'
          }, 'tl;dr', modal, event);
        }
      },
      {
        text: 'Key Points',
        emoji: '🔑',
        action: async (event, modal) => {
          await handleSummarize({
            sharedContext: "You are a writer specialized in creative writing and text generation. Your task is to summarize the key points in any given text.",
            context: "Summarize the key points in this text. Do not provide greetings or comments, just summarize the key points in the text.",
            type: 'key-points'
          }, 'Key Points', modal, event);
        }
      },
      {
        text: 'Teaser',
        emoji: '✨',
        action: async (event, modal) => {
          await handleSummarize({
            sharedContext: "You are a writer specialized in creative writing and text generation. Your task is to summarize the text in a teaser.",
            context: "Summarize this text in a teaser. Do not provide greetings or comments, just summarize the text in a teaser.",
            type: 'teaser'
          }, 'Teaser', modal, event);
        }
      },
      {
        text: 'Headline',
        emoji: '📰',
        action: async (event, modal) => {
          await handleSummarize({
            sharedContext: "You are a writer specialized in creative writing and text generation. Your task is to summarize the text in a headline.",
            context: "Summarize this text in a headline. Do not provide greetings or comments, just summarize the text in a headline.",
            type: 'headline'
          }, 'Headline', modal, event);
        }
      }
    ]
  },
  {
    text: 'Suggestions',
    emoji: '💭',
    subMenu: [
      {
        text: "Continue writing",
        emoji: '➡️',
        action: async (event, modal) => {
          await handlePrompt({
            systemPrompt: "You are a writer specialized in creative writing and text generation. Your task is to seamlessly continue any given text, maintaining its tone, style, and context.",
            prompt: "TEXT: {SELECTED_TEXT}\n\nPlease generate an immediate continuation of the text, ensuring that the tone, style, and context of the original writing are preserved. Do not provide greetings or comments, just continue the text, and only one option is required."
          }, "Continue writing", modal, "Suggestions", event);
        }
      },
      {
        text: "Explain like I'm 5", 
        emoji: '👶',
        action: async (event, modal) => {
          await handleWrite({
            sharedContext: "You are a writer specialized in creative writing and text generation. Your task is to explain complex concepts in a way that a 5-year-old child would understand.",
            context: "Explain this text in a way that a 5-year-old child would understand. Do not provide greetings or comments, just rewrite the text in a way that a child would understand."
          }, "Explain like I'm 5", modal, event);
        }
      },
      {
          text: "Respond to an email",
          emoji: '📧',        
          action: async (event, modal) => {
            await handlePrompt({
              systemPrompt: "You are a writer specialized in creative writing and text generation. Your task is to respond to an email in a professional and concise manner.",
              prompt: "EMAIL: {SELECTED_TEXT}\n\nYou have received an email. Please respond to the email in a professional and concise manner. Do not provide greetings or comments, just respond to the email."
            }, "Respond to an email", modal, "Suggestions", event);
          }
      },
      {
        text: "Comment on a social media post",
        emoji: '💬',
        action: async (event, modal) => {
          await handlePrompt({
            systemPrompt: "You are a writer specialized in creative writing and text generation. Your task is to comment on a social media post in a creative and engaging way.",
            prompt: "POST: {SELECTED_TEXT}\n\nBased on the text above, generate a single concise, relevant, and thoughtful comment that adds value to the conversation, maintaining a tone aligned with the context and intent of the author. Do not provide greetings or comments, just write a comment."
          }, "Comment on a social media post", modal, "Suggestions", event);
        }
      },
      {
        text: "Emphasize",
        emoji: '💪',
        action: async (event, modal) => {
          await handleWrite({
            sharedContext: "You are a writer specialized in creative writing and text generation. Your task is to emphasize the key points in any given text.",
            context: "Emphasize the key points in this text. Rewrite the text to make the key points stand out."
          }, "Emphasize", modal, event);
        }
      },
      {
        text: "Give an example",
        emoji: '💡',
        action: async (event, modal) => {
          await handleWrite({
            sharedContext: "You are a writer specialized in creative writing and text generation. Your task is to provide an example related to any given text.",
            context: "Provide an example related to this text."
          }, "Give an example", modal, event);
        }
      },
      {
        text: "Counter argument",
        emoji: '🤔',
        action: async (event, modal) => {
          await handleWrite({
            sharedContext: "You are a writer specialized in creative writing and text generation. Your task is to provide a counter argument to any given text.",
            context: "Provide a counter argument to this text."
          }, "Counter argument", modal, event);
        }
      },
      { 
        text: "Give an analogy",
        emoji: '🔄',
        action: async (event, modal) => {
          await handleWrite({
            sharedContext: "You are a writer specialized in creative writing and text generation. Your task is to provide an analogy related to any given text.",
            context: "Provide an analogy related to this text."
          }, "Give an analogy", modal, event);
        }
      },
      {
        text: "Add a conclusion",
        emoji: '🔚',
        action: async (event, modal) => {
          await handleWrite({
            sharedContext: "You are a writer specialized in creative writing and text generation. Your task is to add a conclusion to any given text.",
            context: "Add a conclusion to this text."
          }, "Add a conclusion", modal, event);
        }
      },
      {
        text: "Custom Suggestion",
        emoji: '🤖',
        action: async (event, modal) => {
          if(!templatePrompt){
            alert("Please set a prompt template in the settings.")
            return;
          }
          await handlePrompt({
            systemPrompt,
            prompt: templatePrompt
          }, 'Custom Suggestion', modal, "Suggestions", event);
        }
      }
    ]
  },
  {
    text: 'Translate',
    emoji: '🌐',
    subMenu: [
      {
        text: 'Spanish',
        emoji: '🇪🇸',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'es' }, 'Translate - Spanish', modal, event);
        }
      },
      {
        text: 'Arabic',
        emoji: '🇸🇦',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'ar' }, 'Translate - Arabic', modal, event);
        }
      },
      {
        text: 'Bengali',
        emoji: '🇧🇩',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'bn' }, 'Translate - Bengali', modal, event);
        }
      },
      {
        text: 'German',
        emoji: '🇩🇪',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'de' }, 'Translate - German', modal, event);
        }
      },
      {
        text: 'French',
        emoji: '🇫🇷',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'fr' }, 'Translate - French', modal, event);
        }
      },
      {
        text: 'Hindi',
        emoji: '🇮🇳',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'hi' }, 'Translate - Hindi', modal, event);
        }
      },
      {
        text: 'Italian',
        emoji: '🇮🇹',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'it' }, 'Translate - Italian', modal, event);
        }
      },
      {
        text: 'Japanese',
        emoji: '🇯🇵',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'ja' }, 'Translate - Japanese', modal, event);
        }
      },
      {
        text: 'Korean',
        emoji: '🇰🇷',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'ko' }, 'Translate - Korean', modal, event);
        }
      },
      {
        text: 'Dutch',
        emoji: '🇳🇱',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'nl' }, 'Translate - Dutch', modal, event);
        }
      },
      {
        text: 'Polish',
        emoji: '🇵🇱',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'pl' }, 'Translate - Polish', modal, event);
        }
      },
      {
        text: 'Portuguese',
        emoji: '🇵🇹',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'pt' }, 'Translate - Portuguese', modal, event);
        }
      },
      {
        text: 'Russian',
        emoji: '🇷🇺',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'ru' }, 'Translate - Russian', modal, event);
        }
      },
      {
        text: 'Thai',
        emoji: '🇹🇭',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'th' }, 'Translate - Thai', modal, event);
        }
      },
      {
        text: 'Turkish',
        emoji: '🇹🇷',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'tr' }, 'Translate - Turkish', modal, event);
        }
      },
      {
        text: 'Vietnamese',
        emoji: '🇻🇳',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'vi' }, 'Translate - Vietnamese', modal, event);
        }
      },
      {
        text: 'Chinese',
        emoji: '🇨🇳',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'zh' }, 'Translate - Chinese', modal, event);
        }
      },
      {
        text: 'Traditional Chinese',
        emoji: '🇭🇰',
        action: async (event, modal) => {
          await handleTranslate({ targetLanguage: 'zh-Hant' }, 'Translate - Traditional Chinese', modal, event);
        }
      }
    ]
  },
  {
    text: 'Chat',
    emoji: '💬',
    action: async () => {
      handleChat();
    }
  }
];

BUTTONS.forEach((buttonData) => {
  const button = document.createElement('button');
  button.classList.add('bg-white', 'text-gray-900', 'px-2.5', 'py-1.5', 'text-sm', 'font-medium', 'shadow-sm', 'ring-1', 'ring-inset', 'ring-gray-300', 'hover:bg-gray-50', 'rounded-md');
  button.setAttribute('tabindex', '-1');
  button.zIndex = 9991;

  button.innerText = `${buttonData.emoji} ${buttonData.text}`;

  if (buttonData.subMenu) {
    button.addEventListener('mouseenter', (event) => {
      showSubMenu(event.target, buttonData.subMenu);
    });
    button.addEventListener('mouseleave', (event) => {
      handleMouseLeaveSubmenu(event);
    });
  } 
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (buttonData.subMenu) {
      showSubMenu(event.target, buttonData.subMenu);
    } else {
      buttonData.action(event);
    }
  });

  menu.appendChild(button);
});

//EVENT LISTENERS
window.addEventListener('load', addEventListenersToShadowDOM);
window.addEventListener('load', injectIntoAllIframes);

document.addEventListener('keydown', async (event) => {
  if (!enabled) return;

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm') {
    event.preventDefault();
    handleChat();
  } else  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
    event.preventDefault();
    await handleShortcutJ(event);
  } else  if ((event.ctrlKey || event.metaKey) && event.key === '/') {
    event.preventDefault();
    await handleShortCtrl(event);
  }
});

document.addEventListener('mousedown', (event) => {
  if (event.target.closest('.result-block-morfosis') && event.target.tagName === 'TEXTAREA') return;

  if (menu.contains(event.target) || (currentModal && currentModal.contains(event.target))) {
    event.preventDefault();
    return;
  }
  isSelecting = true;
  hideFloatingMenu(); // Ocultar el menú durante la selección
});

document.addEventListener('mouseup', handleMouseUp);

document.addEventListener('keyup', handleKeyUp);

document.addEventListener('click', (event) => {
  if (event.target.closest('.result-block-morfosis') && event.target.tagName === 'TEXTAREA') return;

  const clickedOutsideModal = currentModal && !currentModal.contains(event.target);
  if (currentModal && clickedOutsideModal) {
    hideModal();
    hideFloatingMenu();
  }
});

// FUNCIONES
function handleKeyUp(event) {
  if (!enabled) return;
  handleSelection(event);
}

function handleMouseUp(event){
  if (!enabled) return;

  if (event.target.closest('.result-block-morfosis') && event.target.tagName === 'TEXTAREA') return;

  // Limpiar el timeout del menú
  if (menuTimeout) {
    clearTimeout(menuTimeout);
  }

  if (menu.contains(event.target) || (currentModal && currentModal.contains(event.target))) {
    return;
  }

  isSelecting = false;

  menuTimeout = setTimeout(() => {
    handleSelection(event);
  }, 50);
}

// Función para inyectar el script en el iframe
function injectScriptIntoIframe(iframe) {
  try {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    iframeDocument.addEventListener('mouseup', handleMouseUp);
    iframeDocument.addEventListener('keyup', handleKeyUp);
    iframeDocument.addEventListener('keydown', async (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        await handleShortcutJ(event);
      } else  if ((event.ctrlKey || event.metaKey) && event.key === '/') {        event.preventDefault();
        await handleShortCtrl(event);
      }
    });
  } catch (e) {
    console.warn('No se pudo acceder al contenido del iframe:', e);
  }
}

// Busca todos los iframes y trata de inyectar el script
function injectIntoAllIframes() {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    try {
      injectScriptIntoIframe(iframe);
    } catch (error) {
      console.warn('No se pudo acceder al contenido del iframe:', error);
    }
  });
}

function getAllShadowRoots(node) {
  const nodes = [];
  if (node.shadowRoot) {
    nodes.push(node.shadowRoot);
    node.shadowRoot.querySelectorAll('*').forEach((child) => {
      nodes.push(...getAllShadowRoots(child));
    });
  }
  return nodes;
}

function addEventListenersToShadowDOM() {
  const allNodes = getAllShadowRoots(document.body);
  allNodes.forEach((root) => {
    root.addEventListener('mouseup', handleMouseUp);
    root.addEventListener('keyup', handleKeyUp);
    root.addEventListener('keydown', async (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        await handleShortcutJ(event);
      } else  if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        await handleShortCtrl(event);
      }
    });
  });
}

async function handleShortcutJ(event) {
  // Verificar si la selección está dentro de un textarea o contentEditable
  const activeElement = isSelectionInTextArea();
  if (!activeElement) return;

  // Obtener el texto seleccionado
  let selectedText = '';
  const selection = activeElement.ownerDocument.getSelection();

  if (activeElement.isContentEditable) {
    if (selection.rangeCount > 0 && activeElement.contains(selection.anchorNode)) {
      selectedText = selection.toString();
    }
  } else {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    selectedText = activeElement.value.substring(start, end);
  }

  if (!selectedText) return;

  // Inicializar la sesión si no existe
  const session = await ai.languageModel.create(systemPrompt ? { systemPrompt } : {});

  const userMessage = selectedText;

  // Iniciar el streaming del texto generado por la IA
  const stream = session.promptStreaming(userMessage);

  // Variable para acumular el texto generado
  let accumulatedText = '';

  if (activeElement.isContentEditable) {
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Insertar un contenedor para el contenido generado
      const placeholder = document.createElement('span');
      range.insertNode(placeholder);

      // Mover el cursor después del contenedor
      range.setStartAfter(placeholder);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      // Transmitir el texto generado al contenedor
      for await (const chunk of stream) {
        accumulatedText = chunk;

        try {
          // Intentar convertir el texto acumulado a HTML usando marked
          const htmlContent = marked(accumulatedText);
          placeholder.innerHTML = htmlContent;
        } catch (error) {
          // Si falla, insertar como texto plano
          placeholder.textContent = accumulatedText;
        }

        // Permitir que la interfaz de usuario se actualice
        await new Promise(requestAnimationFrame);
      }
    }
  } else {
    // Para elementos textarea o input
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;

    // Eliminar el texto seleccionado
    const textBefore = activeElement.value.slice(0, start);
    const textAfter = activeElement.value.slice(end);
    let currentText = textBefore;

    activeElement.value = textBefore + textAfter;
    activeElement.selectionStart = activeElement.selectionEnd = start;

    // Transmitir el texto generado al textarea
    for await (const chunk of stream) {
      accumulatedText = chunk;
      currentText = textBefore + accumulatedText;
      activeElement.value = currentText + textAfter;
      activeElement.selectionStart = activeElement.selectionEnd = start + accumulatedText.length;

      // Permitir que la interfaz de usuario se actualice
      await new Promise(requestAnimationFrame);
    }
  }

  // Finalizar la sesión
  session.destroy();
}

async function handleShortCtrl(event) {

  // Get the active element
  const activeElement = isSelectionInTextArea();
  if (!activeElement) return;

  // Get the content of the active element
  let content = '';
  if (activeElement.isContentEditable) {
    content = activeElement.innerHTML;
  } else {
    content = activeElement.value;
  }

  // Process the content
  await processContentWithShortcodes(activeElement, content);
}

// Detectar selección de texto
function handleSelection(event) {
  if (!enabled || isSelecting || currentModal || event.target.closest('#chat-shadow-host')) return;

  // Obtener el documento del evento (puede ser el del iframe o shadowRoot)
  let eventDocument = event.target.ownerDocument || document;

  if (event.target.shadowRoot) {
    eventDocument = event.target.shadowRoot;
  }

  let selectedText = '';
  let rect;
  const isTextArea = isSelectionInTextArea();

  if (isTextArea) {
    const textarea = isTextArea;
    if (textarea.tagName === 'TEXTAREA' || (textarea.tagName === 'INPUT' && textarea.type === 'text')) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      selectedText = textarea.value.substring(start, end).trim();

      // Obtener las coordenadas del cursor dentro del textarea
      const coordinates = getCaretCoordinates(textarea, start);
      const textareaRect = textarea.getBoundingClientRect();
      rect = {
        top: coordinates.top + textareaRect.top,
        bottom: coordinates.top + textareaRect.top + parseInt(window.getComputedStyle(textarea).lineHeight),
        left: coordinates.left + textareaRect.left,
        width: 0,
        height: parseInt(window.getComputedStyle(textarea).lineHeight),
      };
    } else if (textarea.isContentEditable) {
      // Para elementos contentEditable
      const selection = eventDocument.getSelection();
      selectedText = selection.toString().trim();
      if (selectedText) {
        const range = selection.getRangeAt(0);
        rect = range.getBoundingClientRect();
      }
    }
  } else {
    const selection = eventDocument.getSelection();
    selectedText = selection.toString().trim();
    if (selectedText) {
      const range = selection.getRangeAt(0);
      rect = range.getBoundingClientRect();

      // Ajustar el rectángulo si estamos en un iframe
      if (eventDocument !== document) {
        const iframeElement = event.view.frameElement;
        if (iframeElement) {
          const iframeRect = iframeElement.getBoundingClientRect();
          rect = {
            top: rect.top + iframeRect.top,
            bottom: rect.bottom + iframeRect.top,
            left: rect.left + iframeRect.left,
            right: rect.right + iframeRect.left,
            width: rect.width,
            height: rect.height,
          };
        }
      }
    }
  }

  if (selectedText && selectedText.length > 5) {
    selectionRect = rect;
    showFloatingMenu(rect, selectedText, event);
  } else {
    selectionRect = null;
    hideFloatingMenu();
    hideModal();
    menu.dataset.selectedText = '';
  }
}

// Mostrar el menú flotante
function showFloatingMenu(rect, selectedText, event) {
  if (currentModal) return;

  menu.dataset.selectedText = selectedText;

  if (menuTimeout) {
    clearTimeout(menuTimeout);
  }

  menu.style.visibility = 'hidden';
  menu.style.position = 'absolute'; 
  menu.style.left = '-9999px';
  menu.classList.remove('hidden')

  const menuWidth = menu.offsetWidth;

  // Restaurar visibilidad y posición
  menu.style.visibility = '';
  menu.style.left = '';

  // Calcular la posición del menú flotante
  let top = rect.bottom;
  let left = rect.left + rect.width / 2 - menuWidth / 2;

  // Calcular el desplazamiento acumulado si estamos dentro de un iframe
  let cumulativeOffset = { x: 0, y: 0 };
  let currentWindow = event.view;

  while (currentWindow && currentWindow !== window.top) {
    const iframeElement = currentWindow.frameElement;
    if (iframeElement) {
      const iframeRect = iframeElement.getBoundingClientRect();
      cumulativeOffset.x += iframeRect.left;
      cumulativeOffset.y += iframeRect.top;
    }
    currentWindow = currentWindow.parent;
  }

  // Ajustar las coordenadas con el desplazamiento acumulado y el scroll
  top += cumulativeOffset.y + window.scrollY;
  left += cumulativeOffset.x + window.scrollX;

  const finalTop = Math.max(10, top + 10); // Añadir 10px para separar el menú del texto seleccionado;
  const finalLeft = Math.max(10, Math.min(left, window.innerWidth - menu.offsetWidth - 10));
  position = {
    top: finalTop,
    left: finalLeft
  }

  menu.style.position = 'absolute';
  menu.style.top = `${finalTop}px`; // Añadir 10px para separar el menú del texto seleccionado
  menu.style.left = `${finalLeft}px`;
}

function getIframeElement(element) {
  while (element) {
    if (element.tagName === 'IFRAME') {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

// Ocultar el menú flotante
function hideFloatingMenu() {
  menu.classList.add('hidden');
  hideSubMenu();
}

// Mostrar submenú
function showSubMenu(parentButton, subMenuItems) {
  const subMenu = document.createElement('div');
  subMenu.classList.add('absolute', 'mt-0', 'w-48', 'origin-top-right', 'rounded-md', 'bg-white', 'shadow-lg', 'ring-1', 'ring-black/5', 'focus:outline-none', 'divide-y', 'divide-gray-100');
  subMenu.id = 'floating-submenu';
  subMenu.style.zIndex = 9991;

  subMenuItems.forEach((item) => {
    const subButton = document.createElement('button');
    subButton.setAttribute('tabindex', '-1');
    subButton.classList.add('block', 'px-4', 'py-2', 'text-sm', 'text-gray-700', 'w-full', 'text-left', 'hover:bg-gray-100', 'hover:text-gray-900', 'focus:outline-none', 'm-0');
    subButton.innerText = `${item.emoji} ${item.text}`;
    subButton.addEventListener('click', async (event) => {
      hideFloatingMenu();
      currentAction = item; // Guardar la acción actual
      await item.action(event, currentModal); // Pasar el modal actual
      subMenu.remove();
    });
    subButton.addEventListener('mousedown', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideFloatingMenu();
      currentAction = item;
      await item.action(event, currentModal);
      subMenu.remove();
    });
    subMenu.appendChild(subButton);
  });

  const rect = parentButton.getBoundingClientRect();
  subMenu.style.top = `${rect.bottom + window.scrollY}px`;
  subMenu.style.left = `${rect.left + window.scrollX}px`;
  subMenu.addEventListener('mouseenter', () => {
    clearTimeout(subMenu.hideTimeout);
  });
  subMenu.addEventListener('mouseleave', () => {
    hideSubMenu();
  });
  document.body.appendChild(subMenu);
}

// Ocultar submenú
function hideSubMenu() {
  const subMenu = document.getElementById('floating-submenu');
  if (subMenu) {
    subMenu.remove();
  }
}

// Manejar la salida del ratón del botón o submenú
function handleMouseLeaveSubmenu(event) {
  const subMenu = document.getElementById('floating-submenu');
  if (subMenu) {
    const relatedTarget = event.relatedTarget;
    if (!subMenu.contains(relatedTarget) && event.target !== subMenu) {
      subMenu.hideTimeout = setTimeout(() => {
        hideSubMenu();
      }, 300);
    }
  }
}

// Función para mostrar el modal con loader y título
function openModalWithLoader(title, subMenuItems = [], event) {
  // Si ya hay un modal abierto, devolverlo
  if (currentModal) {
    return currentModal;
  }

  hideFloatingMenu();
  const modal = document.createElement('div');
  modal.id = 'floating-modal';
  modal.classList.add('absolute', 'bg-white', 'shadow', 'p-4', 'rounded', 'flex', 'flex-col', 'items-center', 'border', 'border-gray-200');
  modal.style.zIndex = 9992;
  // Posicionar el modal debajo de la selección
  if(position) {
    modal.style.position = 'absolute';
    modal.style.top = `${position.top}px`;
    modal.style.left = `${position.left}px`;
  } else if (selectionRect) {
    // Obtener las coordenadas absolutas de la selección
    let top = selectionRect.bottom;
    let left = selectionRect.left + (selectionRect.width / 2) - (650 / 2);

    // Calcular el desplazamiento acumulado si estamos dentro de un iframe
    let cumulativeOffset = { x: 0, y: 0 };
    let currentWindow = event.view;

    while (currentWindow && currentWindow !== window.top) {
      const iframeElement = currentWindow.frameElement;
      if (iframeElement) {
        const iframeRect = iframeElement.getBoundingClientRect();
        cumulativeOffset.x += iframeRect.left;
        cumulativeOffset.y += iframeRect.top;
      }
      currentWindow = currentWindow.parent;
    }

    // Ajustar las coordenadas con el desplazamiento acumulado y el scroll
    top += cumulativeOffset.y + window.scrollY;
    left += cumulativeOffset.x + window.scrollX;

    modal.style.position = 'absolute';
    modal.style.top = `${Math.max(10, top + 10)}px`; // Añadir 10px para separar el modal del texto seleccionado
    modal.style.left = `${Math.max(10, Math.min(left, window.innerWidth - 650 - 10))}px`;
  } else {
    // Si no hay selección, centrar el modal
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
  }
  modal.style.width = '700px';

  // Título del modal
  const modalHeader = document.createElement('div');
  modalHeader.classList.add('w-full', 'flex', 'justify-between', 'items-center', 'border-b', 'border-gray-200', 'pb-2');

  const modalTitle = document.createElement('h2');
  modalTitle.innerText = title;
  modalTitle.classList.add('text-xl', 'font-semibold', 'my-0', 'text-black');

  modalHeader.appendChild(modalTitle);

  // Botones de pestañas si hay submenús
  if (subMenuItems.length > 0) {
    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('flex', 'gap-x-2', 'gap-y-2', 'flex-wrap', 'px-8');

    subMenuItems.forEach((item) => {
      const tabButton = document.createElement('button');
      tabButton.innerText = item.emoji;
      tabButton.title = item.text;
      tabButton.classList.add('p-2', 'text-sm', 'bg-gray-200', 'rounded', 'hover:bg-gray-100', 'text-black');
      tabButton.addEventListener('click', async (event) => {
        await item.action(event,currentModal); // Pasar el modal actual
      });
      tabsContainer.appendChild(tabButton);
    });

    modalHeader.appendChild(tabsContainer);
  }

  // Botón de cierre
  const closeButton = document.createElement('button');
  closeButton.innerText = '×';
  closeButton.classList.add('text-2xl', 'font-bold', 'text-gray-500', 'hover:text-gray-700', 'focus:outline-none');
  closeButton.addEventListener('click', () => {
    hideModal();
    handleSelection(event);
  });
  modalHeader.appendChild(closeButton);

  modal.appendChild(modalHeader);

  // Contenedor para el contenido del modal
  const modalContent = document.createElement('div');
  modalContent.classList.add('w-full', 'divide-y', 'divide-gray-200', 'max-h-[50vh]', 'overflow-y-auto');
  modalContent.id = 'modal-content';

  modal.appendChild(modalContent);

  document.body.appendChild(modal);

  currentModal = modal; // Guardar referencia al modal actual

  return modal;
}

// Ocultar modal
function hideModal() {
  if (currentModal) {
    if (currentModal.controllers) {
      currentModal.controllers.forEach(controller => controller.abort());
    }
    currentModal.remove();
    currentModal = null;
  }
}

// Función para capitalizar la primera letra
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Función genérica para manejar acciones
async function handleAction(actionType, params = {}, actionTitle = '', modal = null, n = 3, subMenuTag, event) {
  if (!enabled) return; 

  const selectedText = menu.dataset.selectedText;

  hideFloatingMenu();

  if (!modal) {
    const subMenuItems = BUTTONS.find(button => button.text === capitalizeFirstLetter(subMenuTag ?? actionType)).subMenu;
    modal = openModalWithLoader(capitalizeFirstLetter(actionType), subMenuItems, event);
  }

  try {
    // Desactivar menú
    disableMenu();

    const modalContent = modal.querySelector('#modal-content');

    // Crear un contenedor para el bloque de resultados
    const blockContainer = document.createElement('div');
    blockContainer.classList.add('result-block-morfosis', 'divide-y', 'divide-gray-200');

    // Agregar el blockContainer al modalContent antes de iniciar el streaming
    modalContent.insertBefore(blockContainer, modalContent.firstChild);

    if (!modal.controllers) {
      modal.controllers = [];
    }

    // Generar 3 opciones
    const promises = [];
    for (let i = 0; i < n; i++) {
      promises.push((async () => {
        let instance, stream;
        const controller = new AbortController();
        modal.controllers.push(controller);

        // Crear contenedor para el resultado
        const resultContainer = document.createElement('div');
        resultContainer.controller = controller;
        resultContainer.classList.add('p-2', 'my-2', 'text-black', 'w-full', 'text-left', 'relative');

        // Título de la opción
        const optionTitle = document.createElement('h3');
        optionTitle.innerText = actionTitle;
        optionTitle.classList.add('font-semibold', 'mb-2', 'mt-0', 'text-base');
        resultContainer.appendChild(optionTitle);

        // Contenedor de texto
        const textContainer = document.createElement('div');
        textContainer.classList.add('whitespace-pre-wrap', 'text-sm', 'text-blue-600', 'markdown-content');
        resultContainer.appendChild(textContainer);

        // Agregar loader al textContainer
        const loader = document.createElement('div');
        loader.innerText = '⏳ Loading...';
        loader.classList.add('text-center'); // Asegúrate de tener estilos para el loader
        textContainer.appendChild(loader);

        // Botones de copiar, reemplazar y eliminar
        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('absolute', 'top-2', 'right-2', 'flex', 'space-x-2', 'items-center');

        // Botón de copiar
        const copyButton = document.createElement('button');
        copyButton.title = 'Copy Text';
        copyButton.innerText = '📋';
        copyButton.classList.add('p-2', 'hover:bg-gray-200', 'hover:rounded', 'focus:outline-none', 'flex', 'items-center', 'justify-center');
        copyButton.disabled = true;
        buttonsContainer.appendChild(copyButton);

        // Verificar si se puede reemplazar el texto
        const isInTextArea = isSelectionInTextArea();
        let replaceButton;
        if (isInTextArea) {
          replaceButton = document.createElement('button');
          replaceButton.tabIndex = -1;
          replaceButton.title = 'Replace Text';
          replaceButton.innerText = '🔄';
          replaceButton.classList.add('p-2', 'hover:bg-gray-200', 'hover:rounded', 'focus:outline-none', 'flex', 'items-center', 'justify-center');
          replaceButton.disabled = true;
          replaceButton.addEventListener('click', () => {
            replaceSelectedText(textContainer.innerHTML, accumulatedText);
            hideModal();
            hideFloatingMenu();
          });
          replaceButton.addEventListener('mousedown', (event) => {
            event.preventDefault();
            event.stopPropagation();
          });
          buttonsContainer.appendChild(replaceButton);
        }

        // Botón de eliminar
        const deleteButton = document.createElement('button');
        deleteButton.title = 'Delete Result';
        deleteButton.innerText = '×';
        deleteButton.classList.add('p-2', 'hover:bg-gray-200', 'hover:rounded', 'focus:outline-none', 'flex', 'items-center', 'justify-center');
        deleteButton.disabled = true;
        deleteButton.addEventListener('click', () => {
          if (resultContainer.controller) {
            resultContainer.controller.abort();
          }
          resultContainer.remove();
        });
        buttonsContainer.appendChild(deleteButton);

        resultContainer.appendChild(buttonsContainer);

        const textArea = document.createElement('textarea');
        textArea.classList.add('w-full', 'h-auto', 'p-2', 'border', 'rounded', 'text-sm', 'font-mono');
        textArea.rows = 5;
        textArea.style.display = 'none';
        textArea.style.fieldSizing = 'content';
        resultContainer.appendChild(textArea);

        // Alternar entre textContainer y textarea
        textContainer.addEventListener('click', () => {
          textArea.value = accumulatedText; // Sincronizar contenido con el Markdown original
          textContainer.style.display = 'none';
          textArea.style.display = 'block';
          textArea.focus(); // Enfocar el textarea para que sea editable
        });

        // Detectar clics fuera del textarea para cerrarlo
        const handleClickOutside = (event) => {
          if (!textArea.contains(event.target)) {
            accumulatedText = textArea.value; // Actualizar el contenido de Markdown
            textContainer.innerHTML = marked.parse(accumulatedText); // Renderizar el Markdown
            textArea.style.display = 'none';
            textContainer.style.display = 'block';

            // Remover el evento global una vez que el textarea está cerrado
            document.removeEventListener('mousedown', handleClickOutside);
          }
        };

        textArea.addEventListener('focus', () => {
          // Agregar evento global para capturar clics fuera
          document.addEventListener('mousedown', handleClickOutside);
        });

        // Agregar el resultContainer al blockContainer
        blockContainer.appendChild(resultContainer);
        let accumulatedText = '';

        if (actionType === 'Rewrite') {
          instance = await ai.rewriter.create({
            ...params,
          });
          stream = instance.rewriteStreaming(selectedText, {
            signal: controller.signal,
          });
        } else if (actionType === 'Summarize') {
          const { context, ...rest } = params;
          instance = await ai.summarizer.create({
            ...rest,
            length,
            format: "markdown",
          });
          stream = instance.summarizeStreaming(selectedText, {
            context,
            signal: controller.signal,
          });
        } else if (actionType === 'Suggestions') {
          const { sharedContext, context } = params;
          instance = await ai.writer.create({
            sharedContext,
            format: "markdown",
          });
          stream = instance.writeStreaming(selectedText, {
            context,
            signal: controller.signal,
          });
        } else if (actionType.startsWith('Translate')) {
          const { targetLanguage } = params;
          const detector = await translation.createDetector();
          const results = await detector.detect(selectedText);
          const sourceLanguage = results[0].detectedLanguage || 'en';
          instance = await translation.createTranslator({
            sourceLanguage,
            targetLanguage,
            signal: controller.signal,
          });

          // Mostrar loader mientras se genera la traducción
          stream = await instance.translate(selectedText);
          textContainer.removeChild(loader);
          textContainer.innerText = stream;
          accumulatedText = stream;
          instance.destroy();
        } else if (actionType === 'Prompt') {
          const { systemPrompt, prompt } = params;
          instance = await ai.languageModel.create({
            systemPrompt,
          });
          const finalPrompt = replaceSelectedTextInPrompt(prompt, selectedText);
          stream = instance.promptStreaming(finalPrompt, {
            signal: controller.signal,
          });
        } else {
          throw new Error(`Tipo de acción desconocido: ${action}`);
        }

        copyButton.disabled = false;
        deleteButton.disabled = false;
        if (replaceButton) replaceButton.disabled = false;
        copyButton.addEventListener('click', () => {
          navigator.clipboard.write([new ClipboardItem({ 
            "text/plain": new Blob([accumulatedText], { type: "text/plain" }),
            "text/html": new Blob([textContainer.innerHTML], { type: "text/html" })
          })]);
        });

        // Mostrar los resultados de la reescritura en tiempo real
        if (actionType !== 'Translate') {
          try {
            for await (const chunk of stream) {
              // Remover loader al recibir el primer chunk
              if (loader.parentNode) {
                textContainer.removeChild(loader);
              }
              accumulatedText = chunk;
              textContainer.innerHTML = marked.parse(accumulatedText);
              // Permitir que el navegador actualice la interfaz de usuario
              await new Promise(requestAnimationFrame);
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.warn('Tarea abortada');
            } else {
              throw error;
            }
          } finally {
            // Destruir la instancia
            instance.destroy();
          }
        }
      })(i));
    }

    // Esperar a que todas las promesas se resuelvan
    await Promise.all(promises);

  } catch (error) {
    console.error(`Error durante la acción ${actionType}:`, error);
    const modalContent = modal.querySelector('#modal-content');
    const errorMessage = document.createElement('div');
    errorMessage.innerText = `Ocurrió un error durante la acción ${actionType.toLowerCase()}.`;
    errorMessage.classList.add('p-2', 'bg-red-500', 'text-white', 'my-1', 'rounded', 'shadow', 'w-full', 'text-left');
    modalContent.appendChild(errorMessage);
  } finally {
    // Reactivar menú
    enableMenu();
  }
}

// Implementación de la reescritura con streaming
async function handleRewrite(params = {}, actionTitle = '', modal = null, event) {
  await handleAction('Rewrite', params, actionTitle, modal, 3, 'Rewrite', event);
}

async function handleWrite(params = {}, actionTitle = '', modal = null, event) {
  await handleAction('Suggestions', params, actionTitle, modal, 3, 'Suggestions', event);
}

async function handlePrompt(params = {}, actionTitle = '', modal = null, subMenuTag, event) {
  await handleAction('Prompt', params, actionTitle, modal, 3, subMenuTag, event);
}

// Función para manejar la acción de resumir
async function handleSummarize(params = {}, actionTitle = '', modal = null, event) {
  await handleAction('Summarize', params, actionTitle, modal, 3, 'Summarize', event);
}

// Función para manejar la acción de traducir
async function handleTranslate(params = {}, actionTitle = '', modal = null, event) {
  await handleAction('Translate' , params, actionTitle, modal, 1, 'Translate', event);
}

// Desactivar y reactivar botones
function disableMenu() {
  menu.querySelectorAll('button').forEach((button) => {
    button.disabled = true;
    button.classList.add('opacity-50', 'cursor-not-allowed');
  });
}

function enableMenu() {
  menu.querySelectorAll('button').forEach((button) => {
    button.disabled = false;
    button.classList.remove('opacity-50', 'cursor-not-allowed');
  });
}

// Función para verificar si la selección está dentro de un textarea o input
function isSelectionInTextArea() {
  let activeElement = document.activeElement;
  let selection = null;

  // Si el foco está dentro de un iframe, obtener el documento y elemento activo del iframe
  if (activeElement && activeElement.tagName === 'IFRAME') {
    try {
      const iframeDocument = activeElement.contentDocument || activeElement.contentWindow.document;
      activeElement = iframeDocument.activeElement;
      selection = iframeDocument.getSelection();
    } catch (e) {
      console.warn('No se pudo acceder al contenido del iframe:', e);
      return null;
    }
  } else {
    selection = window.getSelection();
  }

  if (
    activeElement &&
    (
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement.tagName === 'INPUT' && activeElement.type === 'text')
    )
  ) {
    if (activeElement.selectionStart !== activeElement.selectionEnd) {
      return activeElement;
    }
  } else if (activeElement && activeElement.isContentEditable) {
    if (selection.rangeCount > 0 && activeElement.contains(selection.anchorNode)) {
      return activeElement;
    }
  } else if (selection.rangeCount > 0) {
    // Verificar si el nodo de anclaje está dentro de un elemento contentEditable
    const anchorNode = selection.anchorNode;
    const elementNode = anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode.parentElement;
    const contentEditableElement = elementNode ? elementNode.closest('[contenteditable="true"]') : null;
    if (contentEditableElement) {
      return contentEditableElement;
    }
  }
  return null;
}

// Función para reemplazar el texto seleccionado
function replaceSelectedText(formattedText, markdownText) {
  const activeElement = isSelectionInTextArea();
  if (activeElement) {
    const selection = activeElement.ownerDocument.getSelection();

    if (activeElement.isContentEditable) {
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        try {
          const fragment = range.createContextualFragment(formattedText);
          const lastNode = fragment.lastChild; 

          range.insertNode(fragment);
  
          // Mover el cursor al final del texto insertado
          selection.removeAllRanges();
          const newRange = activeElement.ownerDocument.createRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          selection.addRange(newRange);
        } catch (error) {
          range.insertNode(document.createTextNode(markdownText));
        }
      }
    } else {
      // Manejo para textarea o input
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const text = activeElement.value;
      activeElement.value = text.slice(0, start) + markdownText + text.slice(end);
      activeElement.selectionStart = activeElement.selectionEnd = start + markdownText.length;
    }
  } else {
    // Reemplazo en documentos normales
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    try {
      const fragment = range.createContextualFragment(formattedText);
      const lastNode = fragment.lastChild; // Guarda el último nodo antes de insertar

      range.insertNode(fragment);

      // Opcional: mover el cursor después del contenido insertado
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      selection.addRange(newRange);
    } catch (e) {
      // Si falla, insertar texto en markdown plano
      range.insertNode(document.createTextNode(markdownText));
    }
    selection.removeAllRanges();
  }
}


function replaceSelectedTextInPrompt(template, selectedText) {
  if (!template || !selectedText) {
    console.warn("Template o selectedText no proporcionados correctamente.");
    return template;
  }
  return template.replace(/\{SELECTED_TEXT\}/g, selectedText);
}

async function handleChat() {

  const selectedText = menu.dataset.selectedText || '';
  const controllerPrompt = new AbortController();
  const controllerSummarize = new AbortController();

  let shadowHost = document.getElementById('chat-shadow-host');
  if (shadowHost) {
    const inputField = shadowHost.shadowRoot.querySelector('textarea');
    if (selectedText) {
      inputField.value += ` ${selectedText}`;
      inputField.focus();
    }
    return;
  }

  // Crear el host de sombra y adjuntarlo al body
  shadowHost = document.createElement('div');
  shadowHost.id = 'chat-shadow-host';
  document.body.appendChild(shadowHost);

  // Crear el Shadow DOM
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  // Crear el contenedor principal del chat (barra lateral)
  const modal = document.createElement('div');
  modal.id = 'chat-modal';
  // Estilos en línea para posicionar el chat en el lado derecho
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.right = '0';
  modal.style.width = '400px'; // Ancho deseado
  modal.style.height = '100%';
  modal.style.zIndex = '9999';
  modal.style.backgroundColor = 'white';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.overflow = 'hidden';
  modal.style.borderLeft = '1px solid #e5e7eb';

  // Ajustar el margen del body para hacer espacio para el chat
  document.body.style.transition = 'margin-right 0.3s';
  document.body.style.marginRight = '400px';

  // Encabezado con botón de nueva conversación, info de tokens y botón de cerrar
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.padding = '16px';
  header.style.borderBottom = '1px solid #e5e7eb';

  // Botón de nueva conversación
  const resetButton = document.createElement('button');
  resetButton.innerText = '🔄';
  resetButton.title = 'Nueva Conversación';
  resetButton.style.padding = '8px';
  resetButton.style.cursor = 'pointer';
  resetButton.style.background = 'transparent';
  resetButton.style.border = 'none';
  resetButton.style.fontSize = '24px';
  resetButton.addEventListener('click', () => {
    controllerPrompt.abort();
    controllerSummarize.abort();
    if (session) {
      session.destroy();
    }
    session = null;
    messagesContainer.innerHTML = '';
    tokenInfo.innerText = '';
    inputField.disabled = false;
    sendButton.disabled = false;
    inputField.style.opacity = '1';
    sendButton.style.opacity = '1';
  });
  header.appendChild(resetButton);

  const tokenInfo = document.createElement('div');
  tokenInfo.id = 'token-info';
  tokenInfo.style.color = '#6b7280';
  tokenInfo.style.fontSize = '12px';
  header.appendChild(tokenInfo);

  const closeButton = document.createElement('button');
  closeButton.innerText = '×';
  closeButton.title = 'Cerrar Chat';
  closeButton.style.fontSize = '24px';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.color = '#6b7280';
  closeButton.style.background = 'transparent';
  closeButton.style.border = 'none';
  closeButton.style.cursor = 'pointer';
  closeButton.addEventListener('click', () => {
    controllerPrompt.abort();
    controllerSummarize.abort();
    if (session) {
      session.destroy();
      session = null;
    }
    document.body.style.marginRight = '';
    shadowHost.remove();
  });
  header.appendChild(closeButton);

  modal.appendChild(header);

  // Contenedor de mensajes
  const messagesContainer = document.createElement('div');
  messagesContainer.style.flex = '1';
  messagesContainer.style.overflowY = 'auto';
  messagesContainer.style.padding = '16px';
  modal.appendChild(messagesContainer);

  // Área de variables (botones)
  const variablesArea = document.createElement('div');
  variablesArea.style.display = 'flex';
  variablesArea.style.padding = '16px';
  variablesArea.style.borderTop = '1px solid #e5e7eb';
  variablesArea.style.alignItems = 'center';

  // Botón {PAGE}
  const pageButton = document.createElement('button');
  pageButton.innerText = '{PAGE}';
  pageButton.style.backgroundColor = '#e5e7eb';
  pageButton.style.color = '#374151';
  pageButton.style.padding = '8px 16px';
  pageButton.style.marginRight = '8px';
  pageButton.style.borderRadius = '4px';
  pageButton.style.cursor = 'pointer';
  pageButton.style.border = 'none';
  pageButton.addEventListener('click', () => {
    inputField.value += '{PAGE}';
    inputField.focus();
  });
  variablesArea.appendChild(pageButton);

  // Botón {SUMMARY_PAGE}
  const summaryPageButton = document.createElement('button');
  summaryPageButton.innerText = '{SUMMARY_PAGE}';
  summaryPageButton.style.backgroundColor = '#e5e7eb';
  summaryPageButton.style.color = '#374151';
  summaryPageButton.style.padding = '8px 16px';
  summaryPageButton.style.marginRight = '8px';
  summaryPageButton.style.borderRadius = '4px';
  summaryPageButton.style.cursor = 'pointer';
  summaryPageButton.style.border = 'none';
  summaryPageButton.addEventListener('click', () => {
    inputField.value += '{SUMMARY_PAGE}';
    inputField.focus();
  });
  variablesArea.appendChild(summaryPageButton);

  modal.appendChild(variablesArea);

  // Área de entrada
  const inputArea = document.createElement('div');
  inputArea.style.display = 'flex';
  inputArea.style.padding = '16px';
  inputArea.style.borderTop = '1px solid #e5e7eb';
  inputArea.style.alignItems = 'center';

  const inputField = document.createElement('textarea');
  inputField.style.flex = '1';
  inputField.style.border = '1px solid #e5e7eb';
  inputField.style.borderRadius = '4px';
  inputField.style.padding = '8px';
  inputField.style.fieldSizing = 'content';
  inputField.style.minHeight = '80px';
  inputField.style.maxHeight = '300px';
  inputField.style.fontSize = '16px';
  inputField.style.outline = 'none';
  inputField.style.backgroundColor = 'white';
  inputField.style.color = 'black';

  if (selectedText) {
    inputField.value = `TEXT: ${selectedText}`;
  } else {
    inputField.placeholder = 'Inserta tu mensaje...';
  }

  inputArea.appendChild(inputField);

  const sendButton = document.createElement('button');
  sendButton.innerText = 'Enviar';
  sendButton.style.backgroundColor = '#3b82f6';
  sendButton.style.color = 'white';
  sendButton.style.padding = '8px 16px';
  sendButton.style.marginLeft = '8px';
  sendButton.style.borderRadius = '4px';
  sendButton.style.cursor = 'pointer';
  sendButton.style.border = 'none';

  inputArea.appendChild(sendButton);
  modal.appendChild(inputArea);

  // Adjuntar el modal al shadow root
  shadowRoot.appendChild(modal);

  inputField.focus();

  let session = null;

  function updateTokenInfo() {
    if (session) {
      tokenInfo.innerText = `Información de Tokens: ${session.tokensSoFar}/${session.maxTokens} (${session.tokensLeft} restantes)`;
    }
  }

  // Función sendMessage ajustada
  async function sendMessage() {
    const rawUserMessage = inputField.value.trim();
    if (!rawUserMessage) return;

    // Deshabilitar el botón de enviar y el campo de entrada
    inputField.disabled = true;
    sendButton.disabled = true;
    inputField.style.opacity = '0.5';
    sendButton.style.opacity = '0.5';

    // Mostrar el mensaje del usuario inmediatamente en el chat (con variables)
    const userMessageDiv = document.createElement('div');
    userMessageDiv.style.display = 'flex';
    userMessageDiv.style.justifyContent = 'flex-end';
    userMessageDiv.style.alignItems = 'flex-end';
    userMessageDiv.style.marginBottom = '8px';
    userMessageDiv.style.fontSize = '14px';

    const copyButton = document.createElement('button');
    copyButton.title = 'Copiar Texto';
    copyButton.innerText = '📋';
    copyButton.style.padding = '8px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.background = 'transparent';
    copyButton.style.border = 'none';
    copyButton.style.position = 'sticky';
    copyButton.style.bottom = '4px';
    copyButton.style.height = 'fit-content';
    copyButton.addEventListener('click', () => {
      navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([rawUserMessage], { type: "text/plain" }),
        "text/html": new Blob([marked.parse(rawUserMessage)], { type: "text/html" })
      })]);
    });
    userMessageDiv.appendChild(copyButton);

    const userMessageContent = document.createElement('div');
    userMessageContent.style.backgroundColor = '#dbeafe';
    userMessageContent.style.color = '#1e40af';
    userMessageContent.style.padding = '8px';
    userMessageContent.style.borderRadius = '8px';
    userMessageContent.style.maxWidth = '80%';
    userMessageContent.innerHTML = marked.parse(rawUserMessage);
    userMessageDiv.appendChild(userMessageContent);

    messagesContainer.appendChild(userMessageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    inputField.value = '';
    inputField.focus();

    // Mostrar el mensaje de la IA con "⌛Loading" mientras se procesa
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.style.display = 'flex';
    aiMessageDiv.style.justifyContent = 'flex-start';
    aiMessageDiv.style.alignItems = 'flex-end';
    aiMessageDiv.style.marginBottom = '8px';

    const aiMessageContent = document.createElement('div');
    aiMessageContent.style.backgroundColor = '#f3f4f6';
    aiMessageContent.style.color = '#374151';
    aiMessageContent.style.padding = '8px';
    aiMessageContent.style.borderRadius = '8px';
    aiMessageContent.style.maxWidth = '80%';
    aiMessageContent.style.fontSize = '14px';
    aiMessageContent.innerText = '⌛ Cargando...';
    aiMessageDiv.appendChild(aiMessageContent);

    const aiCopyButton = document.createElement('button');
    aiCopyButton.title = 'Copiar Texto';
    aiCopyButton.innerText = '📋';
    aiCopyButton.style.padding = '8px';
    aiCopyButton.style.cursor = 'pointer';
    aiCopyButton.style.background = 'transparent';
    aiCopyButton.style.border = 'none';
    aiCopyButton.style.position = 'sticky';
    aiCopyButton.style.bottom = '4px';
    aiCopyButton.style.height = 'fit-content';
    aiCopyButton.disabled = true; // Deshabilitar hasta que haya contenido
    aiMessageDiv.appendChild(aiCopyButton);

    messagesContainer.appendChild(aiMessageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Procesar las variables (processPlaceholders)
    const userMessage = await processPlaceholders(rawUserMessage, controllerSummarize.signal);

    if (!session) {
      session = await ai.languageModel.create({
        ...(systemPrompt ? { systemPrompt } : {}),
        signal: controllerPrompt.signal
      });
    }

    // Enviar el mensaje procesado a la IA
    const stream = session.promptStreaming(userMessage);

    updateTokenInfo();

    let aiMessageRawText = '';

    // Limpiar el mensaje de "Cargando..." antes de empezar a recibir la respuesta
    aiMessageContent.innerHTML = '';

    for await (const chunk of stream) {
      aiMessageRawText = chunk;
      aiMessageContent.innerHTML = marked.parse(aiMessageRawText);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      await new Promise(requestAnimationFrame);
    }

    // Habilitar el botón de copiar ahora que hay contenido
    aiCopyButton.disabled = false;
    aiCopyButton.addEventListener('click', () => {
      navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([aiMessageRawText], { type: "text/plain" }),
        "text/html": new Blob([marked.parse(aiMessageRawText)], { type: "text/html" })
      })]);
    });

    // Rehabilitar el botón de enviar y el campo de entrada
    inputField.disabled = false;
    sendButton.disabled = false;
    inputField.style.opacity = '1';
    sendButton.style.opacity = '1';

    updateTokenInfo();

    if (session.tokensLeft <= 0) {
      inputField.disabled = true;
      sendButton.disabled = true;
      inputField.style.opacity = '0.5';
      sendButton.style.opacity = '0.5';
    }
  }

  sendButton.addEventListener('click', sendMessage);
  inputField.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await sendMessage();
    }
  });
}

async function processPlaceholders(message, signal) {
  let newMessage = message;
  
  if (newMessage.includes('{PAGE}')) {
    const pageText = document.body.innerText;
    newMessage = newMessage.replaceAll('{PAGE}', pageText);
  }
  
  if (newMessage.includes('{SUMMARY_PAGE}')) {
    const pageText = document.body.innerText;
    
    // Crea una instancia del resumidor
    const summarizer = await ai.summarizer.create({
      type: "key-points",
      format: "markdown",
      length: "long",
      signal
    });
    
    const summary = await summarizer.summarize(pageText);
    summarizer.destroy();
    
    newMessage = newMessage.replaceAll('{SUMMARY_PAGE}', summary);
  }
  
  return newMessage;
}

function extractShortcodesWithPositions(text) {
  const shortcodes = [];
  const availableShortcodes = ['command'];

  // Crear una expresión regular para los shortcodes
  const shortcodeRegex = new RegExp(`\\[(${availableShortcodes.join('|')})\\s*([^\\]]*)\\]`, 'g');
  let match;

  // Buscar los shortcodes y sus posiciones
  while ((match = shortcodeRegex.exec(text))) {
    const [shortcode, name, attributes] = match;
    const index = match.index;

    if (name) {
      // Crear un objeto para el shortcode actual
      const shortcodeObj = {
        name,
        shortcode,
        attributes: {},
        index, // posición inicial del shortcode en el texto
        length: shortcode.length // longitud del shortcode
      };

      // Extraer los atributos
      const attributeRegex = /(\S+)\s*=\s*"([^"]*)"/g;
      let attributeMatch;

      while ((attributeMatch = attributeRegex.exec(attributes))) {
        const [, key, value] = attributeMatch;
        shortcodeObj.attributes[key] = value;
      }

      // Añadir el shortcode al array
      shortcodes.push(shortcodeObj);
    }
  }

  return shortcodes;
}

async function processContentWithShortcodes(activeElement, content) {
  const shortcodeList = extractShortcodesWithPositions(content);

  if (shortcodeList.length === 0) {
    // No hay shortcodes, no se necesita procesamiento
    return;
  }

  let accumulatedResult = '';

  // Procesar cada shortcode secuencialmente
  for (let i = 0; i < shortcodeList.length; i++) {
    const shortcodeObj = shortcodeList[i];
    const { name, shortcode, attributes, index, length } = shortcodeObj;

    if (name === 'command') {
      const { prompt, systemPrompt: shortSystemPrompt, lookBack = false } = attributes;

      // Convertir lookBack a booleano
      const lookBackBool = lookBack === 'true' || lookBack === true;

      const instance = await ai.languageModel.create({
        systemPrompt: shortSystemPrompt ? shortSystemPrompt : systemPrompt,
      });

      let finalPrompt = prompt;
      if (lookBackBool) {
        finalPrompt = accumulatedResult + finalPrompt;
      }

      // Iniciar el streaming de la respuesta de la IA
      const stream = instance.promptStreaming(finalPrompt);

      let accumulatedText = '';

      if (activeElement.isContentEditable) {
        // Para elementos contentEditable
        await processInContentEditable(activeElement, shortcode, stream, accumulatedText);
      } else {
        // Para elementos textarea o input
        await processInTextarea(activeElement, shortcode, stream, accumulatedText);
      }

      accumulatedResult += accumulatedText;

      instance.destroy();
    }
  }
}

async function processInContentEditable(activeElement, shortcode, stream, accumulatedText) {
  const selection = activeElement.ownerDocument.getSelection();
  const range = activeElement.ownerDocument.createRange();

  // Buscar el nodo de texto que contiene el shortcode
  const walker = activeElement.ownerDocument.createTreeWalker(
    activeElement,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let textNode;
  while ((textNode = walker.nextNode())) {
    const pos = textNode.data.indexOf(shortcode);
    if (pos !== -1) {
      // Encontramos el nodo que contiene el shortcode
      range.setStart(textNode, pos);
      range.setEnd(textNode, pos + shortcode.length);

      // Reemplazar el shortcode con un contenedor
      const placeholder = document.createElement('span');
      range.deleteContents();
      range.insertNode(placeholder);

      // Mover el cursor después del contenedor
      selection.removeAllRanges();
      selection.addRange(range);

      // Transmitir el texto generado al contenedor
      for await (const chunk of stream) {
        accumulatedText = chunk;

        try {
          // Intentar convertir el texto acumulado a HTML usando marked
          const htmlContent = marked(accumulatedText);
          placeholder.innerHTML = htmlContent;
        } catch (error) {
          // Si falla, insertar como texto plano
          placeholder.textContent = accumulatedText;
        }

        // Permitir que la interfaz de usuario se actualice
        await new Promise(requestAnimationFrame);
      }

      break; // Salir del bucle una vez procesado
    }
  }
}

async function processInTextarea(activeElement, shortcode, stream, accumulatedText) {
  const content = activeElement.value;
  const index = content.indexOf(shortcode);

  if (index !== -1) {
    const start = index;
    const end = index + shortcode.length;

    // Eliminar el shortcode del contenido
    const textBefore = content.slice(0, start);
    const textAfter = content.slice(end);

    activeElement.value = textBefore + textAfter;
    activeElement.selectionStart = activeElement.selectionEnd = start;

    // Transmitir el texto generado al textarea
    for await (const chunk of stream) {
      accumulatedText = chunk;
      const currentText = textBefore + accumulatedText;

      activeElement.value = currentText + textAfter;
      activeElement.selectionStart = activeElement.selectionEnd = start + accumulatedText.length;

      // Permitir que la interfaz de usuario se actualice
      await new Promise(requestAnimationFrame);
    }
  }
}

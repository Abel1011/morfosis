//VARIABLES DE CONFIGURACIÓN
let enabled = true;
let customCommand = '';
let length = 'short';
let systemPrompt = '';
let templatePrompt = '';
let targetLanguage = 'es';
let menuTimeout = null;


chrome.storage.sync.get(['enabled', 'customCommand', 'length', 'systemPrompt', 'templatePrompt', 'targetLanguage'], function(result) {
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
  if (result.targetLanguage) {
    targetLanguage = result.targetLanguage;
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
    if (changes.targetLanguage) {
      targetLanguage = changes.targetLanguage.newValue;
      console.log('Target language updated:', targetLanguage);
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
suggestionsContainer.classList.add('fixed', 'bottom-0', 'left-0', 'w-full', 'bg-gray-100', 'p-4');
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
        emoji: '📝',
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
            type: 'tl;dr'
          }, 'tl;dr', modal, event);
        }
      },
      {
        text: 'Key Points',
        emoji: '🔑',
        action: async (event, modal) => {
          await handleSummarize({
            type: 'key-points'
          }, 'Key Points', modal, event);
        }
      },
      {
        text: 'Teaser',
        emoji: '✨',
        action: async (event, modal) => {
          await handleSummarize({
            type: 'teaser'
          }, 'Teaser', modal, event);
        }
      },
      {
        text: 'Headline',
        emoji: '📰',
        action: async (event, modal) => {
          await handleSummarize({
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
            prompt: "TEXT: {SELECTED_TEXT}\n\nPlease generate an immediate continuation of the text, ensuring that the tone, style, and context of the original writing are preserved. Do not provide greetings or comments, just continue the text."
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
    action: async (event, modal) => {
      await handleTranslate({}, 'Translate', modal, event);
    }
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
  button.classList.add('bg-white', 'text-gray-900', 'px-2.5', 'py-1.5', 'text-sm', 'font-semibold', 'shadow-sm', 'ring-1', 'ring-inset', 'ring-gray-300', 'hover:bg-gray-50', 'rounded-md');
  button.setAttribute('tabindex', '-1');

  button.innerText = `${buttonData.emoji} ${buttonData.text}`;

  if (buttonData.subMenu) {
    button.addEventListener('mouseenter', (event) => {
      showSubMenu(event.target, buttonData.subMenu);
    });
    button.addEventListener('mouseleave', (event) => {
      handleMouseLeaveSubmenu(event);
    });
  } else {
    button.addEventListener('click', buttonData.action);
  }
  button.addEventListener('mousedown', (event) => {
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

document.addEventListener('keydown', (event) => {
  if (!enabled) return;

  if (event.ctrlKey && event.key === 'm') {
    event.preventDefault();
    handleChat();
  }
});

document.addEventListener('mousedown', (event) => {
  if (menu.contains(event.target) || (currentModal && currentModal.contains(event.target))) {
    event.preventDefault();
    return;
  }
  isSelecting = true;
  hideFloatingMenu(); // Ocultar el menú durante la selección
});

document.addEventListener('mouseup', (event) => {
  if (!enabled) return;

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
});

document.addEventListener('keyup', (event) => {
  if (!enabled) return;
  handleSelection(event);
});

document.addEventListener('click', (event) => {
  const clickedOutsideModal = currentModal && !currentModal.contains(event.target);
  if (currentModal && clickedOutsideModal) {
    hideModal();
    hideFloatingMenu();
  }
});

// FUNCIONES
// Función para inyectar el script en el iframe
function injectScriptIntoIframe(iframe) {
  try {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    iframeDocument.addEventListener('mouseup', handleSelection);
    iframeDocument.addEventListener('keyup', handleSelection);
  } catch (e) {
    console.warn('No se pudo acceder al contenido del iframe:', e);
  }
}

// Busca todos los iframes y trata de inyectar el script
function injectIntoAllIframes() {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    injectScriptIntoIframe(iframe);
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
    root.addEventListener('mouseup', handleSelection);
    root.addEventListener('keyup', handleSelection);
  });
}

// Detectar selección de texto
function handleSelection(event) {
  if (!enabled || isSelecting || currentModal || event.target.closest('#chat-modal')) return;

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
    subButton.classList.add('block', 'px-4', 'py-2', 'text-sm', 'text-gray-700', 'w-full', 'text-left', 'hover:bg-gray-100', 'hover:text-gray-900', 'focus:outline-none');
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
  modalTitle.classList.add('text-xl', 'font-semibold', 'mt-0', 'text-black');

  modalHeader.appendChild(modalTitle);

  // Botones de pestañas si hay submenús
  if (subMenuItems.length > 0) {
    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('flex', 'space-x-2');

    subMenuItems.forEach((item) => {
      const tabButton = document.createElement('button');
      tabButton.innerText = item.emoji;
      tabButton.title = item.text;
      tabButton.classList.add('p-2', 'text-sm', 'bg-gray-200', 'rounded', 'hover:bg-gray-100');
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
    modal.remove();
    currentModal = null; // Limpiar referencia al modal actual
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
    blockContainer.classList.add('result-block', 'divide-y', 'divide-gray-200');

    // Agregar el blockContainer al modalContent antes de iniciar el streaming
    modalContent.insertBefore(blockContainer, modalContent.firstChild);

    // Generar 3 opciones
    const promises = [];
    for (let i = 0; i < n; i++) {
      promises.push((async (optionIndex) => {
        let instance, stream;
        if (actionType === 'Rewrite') {
          instance = await ai.rewriter.create(params);
          stream = instance.rewriteStreaming(selectedText);
        } else if (actionType === 'Summarize') {
          instance = await ai.summarizer.create({
            ...params,
            length
          });
          stream = instance.summarizeStreaming(selectedText);
        } else if (actionType === 'Suggestions') {
          const { sharedContext, context } = params;
          instance = await ai.writer.create({sharedContext});
          stream = instance.writeStreaming(selectedText, {context});
        } else if (actionType === 'Translate') {
          const detector = await translation.createDetector();
          const results = await detector.detect(selectedText);
          const sourceLanguage = results[0].detectedLanguage || 'en';
          instance = await translation.createTranslator({
            sourceLanguage,
            targetLanguage,
          });
          stream = instance.translate(selectedText);
        } else if (actionType === 'Prompt') {
          const { systemPrompt, prompt } = params;
          instance = await ai.languageModel.create({
            systemPrompt,
          });
          const finalPrompt = replaceSelectedTextInPrompt(prompt, selectedText);
          stream = instance.promptStreaming(finalPrompt);
        } else {
          throw new Error(`Tipo de acción desconocido: ${action}`);
        }

        // Crear contenedor para el resultado
        const resultContainer = document.createElement('div');
        resultContainer.classList.add('p-2', 'my-2', 'text-black', 'w-full', 'text-left', 'relative');

        // Título de la opción
        const optionTitle = document.createElement('h3');
        optionTitle.innerText = `${actionTitle} - Option ${optionIndex + 1}`;
        optionTitle.classList.add('font-semibold', 'mb-2', 'mt-0', 'text-base');
        resultContainer.appendChild(optionTitle);

        // Contenedor de texto
        const textContainer = document.createElement('div');
        textContainer.classList.add('whitespace-pre-wrap', 'text-sm', 'text-blue-600');
        resultContainer.appendChild(textContainer);

        // Botones de copiar, reemplazar y eliminar
        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('absolute', 'top-2', 'right-2', 'flex', 'space-x-2');

        // Botón de copiar
        const copyButton = document.createElement('button');
        copyButton.title = 'Copy Text';
        copyButton.innerText = '📋';
        copyButton.classList.add('p-2', 'hover:bg-gray-200', 'hover:rounded', 'focus:outline-none');
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(textContainer.innerText);
        });
        buttonsContainer.appendChild(copyButton);

        // Verificar si se puede reemplazar el texto
        const isInTextArea = isSelectionInTextArea();
        if (isInTextArea) {
          const replaceButton = document.createElement('button');
          replaceButton.tabIndex = -1;
          replaceButton.title = 'Replace Text';
          replaceButton.innerText = '🔄';
          replaceButton.classList.add('p-2', 'hover:bg-gray-200', 'hover:rounded', 'focus:outline-none');
          replaceButton.addEventListener('click', () => {
            replaceSelectedText(textContainer.innerText);
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
        //Equis de texto
        deleteButton.innerText = '×';
        deleteButton.classList.add('p-2', 'hover:bg-gray-200', 'hover:rounded', 'focus:outline-none');
        deleteButton.addEventListener('click', () => {
          resultContainer.remove();
        });
        buttonsContainer.appendChild(deleteButton);

        resultContainer.appendChild(buttonsContainer);

        // Agregar el resultContainer al blockContainer
        blockContainer.appendChild(resultContainer);

        let accumulatedText = '';
        // Mostrar los resultados de la reescritura en tiempo real
        if (actionType === 'Translate') {
          // Para Translate, que devuelve el texto completo
          accumulatedText = await stream;
          textContainer.innerText = accumulatedText;
        } else {
          // Para acciones que retornan un stream
          for await (const chunk of stream) {
            accumulatedText = chunk;
            textContainer.innerText = accumulatedText;
            // Permitir que el navegador actualice la interfaz de usuario
            await new Promise(requestAnimationFrame);
          }
        }

        // Destruir la instancia
        instance.destroy();
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
  await handleAction('Translate', params, actionTitle, modal, 1, 'Translate', event);
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
function replaceSelectedText(newText) {
  const activeElement = isSelectionInTextArea();
  if (activeElement) {
    const selection = activeElement.ownerDocument.getSelection();

    if (activeElement.isContentEditable) {
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = activeElement.ownerDocument.createTextNode(newText);
        range.insertNode(textNode);

        // Mover el cursor al final del texto insertado
        selection.removeAllRanges();
        const newRange = activeElement.ownerDocument.createRange();
        newRange.setStartAfter(textNode);
        newRange.collapse(true);
        selection.addRange(newRange);
      }
    } else {
      // Manejo para textarea o input
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const text = activeElement.value;
      activeElement.value = text.slice(0, start) + newText + text.slice(end);
      activeElement.selectionStart = activeElement.selectionEnd = start + newText.length;
    }
  } else {
    // Reemplazo en documentos normales
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(newText));
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
  const modal = document.createElement('div');
  modal.id = 'chat-modal';
  modal.classList.add(
    'fixed',
    'inset-0',
    'flex',
    'items-center',
    'justify-center',
    'bg-black',
    'bg-opacity-50'
  );
  modal.style.zIndex = 9999;

  const chatContainer = document.createElement('div');
  chatContainer.classList.add(
    'bg-white',
    'rounded',
    'w-4/5',
    'md:w-1/2',
    'max-h-[80vh]',
    'flex',
    'flex-col',
    'overflow-hidden'
  );

  // Encabezado con botón de nueva conversación, información de tokens y botón de cierre
  const header = document.createElement('div');
  header.classList.add('flex', 'justify-between', 'items-center', 'p-4', 'border-b');

  // Botón de nueva conversación
  const resetButton = document.createElement('button');
  resetButton.innerText = '🔄';
  resetButton.title = 'New Conversation';
  resetButton.classList.add('p-2', 'hover:bg-gray-200', 'hover:rounded', 'focus:outline-none');
  resetButton.addEventListener('click', () => {
    if (session) {
      session.destroy();
    }
    session = null;
    messagesContainer.innerHTML = '';
    tokenInfo.innerText = '';
    inputField.disabled = false;
    sendButton.disabled = false;
    messagesContainer.classList.remove('p-4');
  });
  header.appendChild(resetButton);

  const tokenInfo = document.createElement('div');
  tokenInfo.id = 'token-info';
  tokenInfo.classList.add('text-gray-500', 'text-[12px]');
  header.appendChild(tokenInfo);

  const closeButton = document.createElement('button');
  closeButton.innerText = '×';
  closeButton.title = 'Close Chat';
  closeButton.classList.add('text-2xl', 'font-bold', 'text-gray-500', 'hover:text-gray-700');
  closeButton.addEventListener('click', () => {
    if (session) {
      session.destroy();
      session = null;
    }
    modal.remove();
  });
  header.appendChild(closeButton);
  chatContainer.appendChild(header);

  // Contenedor de mensajes
  const messagesContainer = document.createElement('div');
  messagesContainer.classList.add('flex-1', 'overflow-y-auto', 'space-y-4');
  chatContainer.appendChild(messagesContainer);

  // Área de entrada
  const inputArea = document.createElement('div');
  inputArea.classList.add('p-4', 'border-t', 'flex', 'space-x-2');

  const inputField = document.createElement('textarea');
  inputField.classList.add(
    'flex-1',
    'border',
    'border-gray-200',
    'bg-white',
    'rounded',
    'p-2',
    'resize',
    'appearance-none',
    'focus:outline-none',
    'focus:ring',
    'focus:border-blue-500'
  );
  inputField.rows = 5;
  if (selectedText) {
    inputField.value = `TEXT: ${selectedText}`;
  } else {
    inputField.placeholder = 'Insert your message...';
  }
  inputArea.appendChild(inputField);

  const sendButton = document.createElement('button');
  sendButton.innerText = 'Send';
  sendButton.classList.add('bg-blue-500', 'text-white', 'px-4', 'py-2', 'rounded');
  inputArea.appendChild(sendButton);
  chatContainer.appendChild(inputArea);

  modal.appendChild(chatContainer);
  document.body.appendChild(modal);

  let session = null;

  function updateTokenInfo() {
    if (session) {
      tokenInfo.innerText = `Token Info: ${session.tokensSoFar}/${session.maxTokens} (${session.tokensLeft} left)`;
    }
  }

  // Función sendMessage ajustada
  async function sendMessage() {
    // Agregar padding al contenedor de mensajes solo si es que no lo tiene ya
    if (!messagesContainer.classList.contains('p-4')) messagesContainer.classList.add('p-4');
    const userMessage = inputField.value.trim();
    if (!userMessage) return;

    // Mensaje del usuario
    const userMessageDiv = document.createElement('div');
    userMessageDiv.classList.add('flex', 'justify-end', 'items-center', 'space-x-2');

    const copyButton = document.createElement('button');
    copyButton.title = 'Copy Text';
    copyButton.innerText = '📋';
    copyButton.classList.add('p-2', 'hover:bg-gray-200', 'hover:rounded', 'focus:outline-none');
    // Utiliza el texto sin formato al copiar
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(userMessage);
    });
    userMessageDiv.appendChild(copyButton);

    marked.setOptions({
      breaks: true, // Permite saltos de línea con un solo retorno
      gfm: true,    // GitHub Flavored Markdown
      sanitize: true // Sanitiza el HTML por seguridad
    });

    const userMessageContent = document.createElement('div');
    userMessageContent.classList.add(
      'inline-block',
      'bg-blue-100',
      'text-blue-700',
      'p-2',
      'rounded-lg',
      'max-w-[80%]',
      'markdown-content'
    );
    userMessageContent.innerHTML = marked.parse(userMessage);
    userMessageDiv.appendChild(userMessageContent);

    messagesContainer.appendChild(userMessageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    inputField.value = '';
    inputField.focus();

    if (!session) {
      session = await ai.languageModel.create(systemPrompt ? { systemPrompt } : {});
    }

    // Respuesta de la IA
    const stream = session.promptStreaming(userMessage);
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.classList.add('flex', 'justify-start', 'items-center', 'space-x-2');

    const aiMessageContent = document.createElement('div');
    aiMessageContent.classList.add(
      'inline-block',
      'bg-gray-100',
      'text-gray-700',
      'p-2',
      'rounded-lg',
      'max-w-[80%]',
      'markdown-content'
    );
    aiMessageDiv.appendChild(aiMessageContent);

    const aiCopyButton = document.createElement('button');
    aiCopyButton.title = 'Copy Text';
    aiCopyButton.innerText = '📋';
    aiCopyButton.classList.add('p-2', 'hover:bg-gray-200', 'hover:rounded', 'focus:outline-none');
    // Variable para almacenar el texto sin formato de la IA
    let aiMessageRawText = '';
    aiCopyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(aiMessageRawText);
    });
    aiMessageDiv.appendChild(aiCopyButton);

    messagesContainer.appendChild(aiMessageDiv);

    updateTokenInfo();

    for await (const chunk of stream) {
      aiMessageRawText = chunk;
      aiMessageContent.innerHTML = marked.parse(aiMessageRawText);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      await new Promise(requestAnimationFrame);
    }

    updateTokenInfo();

    if (session.tokensLeft <= 0) {
      inputField.disabled = true;
      sendButton.disabled = true;
    }
  }

  sendButton.addEventListener('click', sendMessage);
  inputField.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
}
// popup.js
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar la configuración guardada
    const settings = await chrome.storage.sync.get(['enabled', 'customCommand', 'length', 'systemPrompt', 'templatePrompt', 'targetLanguage']);
  
    // Configurar el estado del interruptor
    const enableSwitch = document.getElementById('enableSwitch');
    const isEnabled = settings.enabled !== false; // Por defecto, está activado si no está definido
    updateSwitchUI(enableSwitch, isEnabled);
    toggleForm(isEnabled);
  
    // Actualizar los campos del formulario con los valores guardados
    if (settings.customCommand) {
      document.getElementById('customCommand').value = settings.customCommand;
    }
  
    if (settings.length) {
      document.getElementById('length').value = settings.length;
    }
  
    if (settings.systemPrompt) {
      document.getElementById('systemPrompt').value = settings.systemPrompt;
    }
  
    if (settings.templatePrompt) {
      document.getElementById('templatePrompt').value = settings.templatePrompt;
    }
  
    // Añadir evento al interruptor
    enableSwitch.addEventListener('click', () => {
      const currentState = enableSwitch.getAttribute('aria-checked') === 'true';
      const newState = !currentState;
      enableSwitch.setAttribute('aria-checked', newState);
      updateSwitchUI(enableSwitch, newState);
      toggleForm(newState);
  
      // Guardar el nuevo estado
      chrome.storage.sync.set({ enabled: newState });
    });
  
    // Guardar la configuración al enviar el formulario
    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const customCommand = document.getElementById('customCommand').value;
      const length = document.getElementById('length').value;
      const systemPrompt = document.getElementById('systemPrompt').value;
      const templatePrompt = document.getElementById('templatePrompt').value;
      const targetLanguage = document.getElementById('targetLanguage').value;
  
      await chrome.storage.sync.set({
        customCommand,
        length,
        systemPrompt,
        templatePrompt,
        targetLanguage
      });
  
      // Mostrar mensaje de éxito en el div con id "messages"
      const messagesDiv = document.getElementById('messages');
      messagesDiv.textContent = 'Configuración guardada';
      messagesDiv.className = 'rounded-md bg-green-50 p-4 text-sm font-medium text-green-800 mt-4';
  
      setTimeout(() => {
        messagesDiv.textContent = '';
        messagesDiv.className = '';
      }, 2000);
    });
  });
  
  // Función para actualizar la interfaz del interruptor
  function updateSwitchUI(switchElement, isEnabled) {
    const span = switchElement.querySelector('span[aria-hidden="true"]');
    if (isEnabled) {
      switchElement.classList.remove('bg-gray-200');
      switchElement.classList.add('bg-indigo-600');
      span.classList.remove('translate-x-0');
      span.classList.add('translate-x-5');
    } else {
      switchElement.classList.remove('bg-indigo-600');
      switchElement.classList.add('bg-gray-200');
      span.classList.remove('translate-x-5');
      span.classList.add('translate-x-0');
    }
  }
  
  // Función para habilitar o deshabilitar el formulario
  function toggleForm(isEnabled) {
    const formElements = document.querySelectorAll('#configForm input, #configForm select, #configForm textarea, #configForm button');
    formElements.forEach((element) => {
      element.disabled = !isEnabled;
    });
  }
  
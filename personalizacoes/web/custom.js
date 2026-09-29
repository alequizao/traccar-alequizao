// Script personalizado para o Traccar

// Adicionar CSS personalizado
const style = document.createElement('style');
style.textContent = `
  /* Remover espaçamento entre cards e garantir altura adequada */
  .deviceList .MuiListItem-root {
    padding: 0 !important;
    margin: 0 !important;
    border-bottom: 1px solid rgba(0,0,0,0.05) !important;
  }

  .device-container-3lines {
    min-height: 160px !important;
    padding: 16px !important;
  }

  /* Garantir que não há espaçamento extra */
  .deviceList .MuiListItem-root + .MuiListItem-root {
    margin-top: 0 !important;
  }

  /* Remover padding padrão do MUI */
  .deviceList .MuiListItem-root .MuiListItemText-root {
    margin: 0 !important;
    padding: 0 !important;
  }
`;
document.head.appendChild(style);

// Função para inicializar o script quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Aguardar o carregamento completo da aplicação Traccar
  const checkAppLoaded = setInterval(function() {
    // Verificar se a aplicação Traccar foi carregada
    if (document.querySelector('.loader') === null) {
      clearInterval(checkAppLoaded);
      initCustomFeatures();
    }
  }, 500);
});

// Função para inicializar as funcionalidades personalizadas
function initCustomFeatures() {
  // Observar mudanças na lista de dispositivos
  const deviceListObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        enhanceDeviceList();
        enhanceDeviceInfo();
      }
    });
  });

  // Observar mudanças no painel de informações do dispositivo
  const deviceInfoObserver = new MutationObserver(function(mutations) {
    enhanceDeviceInfo();
  });

  // Observar mudanças no cabeçalho
  const headerObserver = new MutationObserver(function(mutations) {
    enhanceHeader();
  });

  // Iniciar a observação da lista de dispositivos
  const startObserving = function() {
    const deviceList = document.querySelector('.deviceList');
    if (deviceList) {
      deviceListObserver.observe(deviceList, { childList: true, subtree: true });
      enhanceDeviceList();
    } else {
      setTimeout(startObserving, 500);
    }

    // Observar o corpo do documento para detectar quando o painel de informações é carregado
    deviceInfoObserver.observe(document.body, { childList: true, subtree: true });
    enhanceDeviceInfo();

    // Observar o corpo do documento para detectar quando o cabeçalho é carregado
    headerObserver.observe(document.body, { childList: true, subtree: true });
    enhanceHeader();
  };

  startObserving();

  // Adicionar listener para eventos de WebSocket para atualizar os dados em tempo real
  addWebSocketListener();
}

// Função para melhorar o cabeçalho
function enhanceHeader() {
  // Procurar pelo elemento do cabeçalho que contém o nome do usuário e status
  const headerElements = document.querySelectorAll('.MuiToolbar-root');
  let userHeader = null;

  for (const header of headerElements) {
    if (header.textContent.includes('ALEQUIZAO') || header.textContent.includes('Conectado')) {
      userHeader = header;
      break;
    }
  }

  if (!userHeader) return;

  // Verificar se o cabeçalho já foi processado
  if (userHeader.getAttribute('data-enhanced') === 'true') {
    return;
  }

  // Marcar o cabeçalho como processado
  userHeader.setAttribute('data-enhanced', 'true');

  // Encontrar o elemento que contém o nome do usuário
  const userElements = userHeader.querySelectorAll('div');
  let userElement = null;

  for (const element of userElements) {
    if (element.textContent.includes('ALEQUIZAO')) {
      userElement = element;
      break;
    }
  }

  if (!userElement) return;

  // Obter o dispositivo selecionado
  const selectedDeviceId = getSelectedDeviceId();
  if (!selectedDeviceId) return;

  // Criar container para as informações adicionais
  const infoContainer = document.createElement('div');
  infoContainer.className = 'header-info-container';
  infoContainer.style.display = 'flex';
  infoContainer.style.flexDirection = 'column';
  infoContainer.style.marginLeft = '10px';
  infoContainer.style.fontSize = '12px';

  // Criar elemento para o endereço
  const addressElement = document.createElement('div');
  addressElement.className = 'header-address';
  addressElement.style.color = '#e0e0e0';
  addressElement.style.marginBottom = '2px';
  addressElement.style.maxWidth = '200px';
  addressElement.style.whiteSpace = 'nowrap';
  addressElement.style.overflow = 'hidden';
  addressElement.style.textOverflow = 'ellipsis';
  addressElement.textContent = 'Carregando endereço...';

  // Criar container para os detalhes
  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'header-details';
  detailsContainer.style.display = 'flex';
  detailsContainer.style.alignItems = 'center';

  // Criar indicador de bateria
  const batteryElement = document.createElement('div');
  batteryElement.className = 'header-battery';
  batteryElement.style.display = 'flex';
  batteryElement.style.alignItems = 'center';
  batteryElement.style.marginRight = '10px';
  batteryElement.style.color = '#4caf50';
  batteryElement.innerHTML = `
    <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 4px; fill: currentColor;">
      <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
    </svg>
    <span class="header-battery-value">N/A</span>
  `;

  // Criar indicador de velocidade
  const speedElement = document.createElement('div');
  speedElement.className = 'header-speed';
  speedElement.style.display = 'flex';
  speedElement.style.alignItems = 'center';
  speedElement.style.marginRight = '10px';
  speedElement.style.color = '#e0e0e0';
  speedElement.innerHTML = `
    <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 4px; fill: currentColor;">
      <path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44z"/>
      <path d="M10.59 15.41a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z"/>
    </svg>
    <span class="header-speed-value">0 km/h</span>
  `;

  // Criar indicador de status
  const statusElement = document.createElement('div');
  statusElement.className = 'header-status';
  statusElement.style.display = 'flex';
  statusElement.style.alignItems = 'center';
  statusElement.style.color = '#4caf50';
  statusElement.innerHTML = `
    <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 4px; fill: currentColor;">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
    <span class="header-status-value">Bom</span>
  `;

  // Adicionar os elementos ao container
  detailsContainer.appendChild(batteryElement);
  detailsContainer.appendChild(speedElement);
  detailsContainer.appendChild(statusElement);

  // Adicionar os containers ao container principal
  infoContainer.appendChild(addressElement);
  infoContainer.appendChild(detailsContainer);

  // Adicionar o container principal ao elemento do usuário
  userElement.parentNode.style.display = 'flex';
  userElement.parentNode.style.alignItems = 'center';
  userElement.parentNode.insertBefore(infoContainer, userElement.nextSibling);

  // Atualizar os dados do dispositivo
  updateHeaderInfo(selectedDeviceId);
}

// Função para melhorar o painel de informações do dispositivo
function enhanceDeviceInfo() {
  // Tentar encontrar o elemento com o seletor específico
  let infoPanel = document.querySelector("#root > div.jss1 > div > div > div.jss48 > div.MuiPaper-root.MuiPaper-elevation.MuiPaper-elevation1.jss50.muiltr-ma8f29 > div > div > div > div");

  // Se não encontrar, tentar um seletor mais genérico
  if (!infoPanel) {
    infoPanel = document.querySelector(".MuiPaper-root > div > div > div > div");
  }

  // Se ainda não encontrar, tentar outro seletor
  if (!infoPanel) {
    infoPanel = document.querySelector(".devicePositionPanel");
  }

  // Último recurso: procurar por qualquer div que possa conter as informações do dispositivo
  if (!infoPanel) {
    const papers = document.querySelectorAll(".MuiPaper-root");
    for (const paper of papers) {
      if (paper.textContent.includes("Velocidade") || paper.textContent.includes("Altitude") || paper.textContent.includes("Curso")) {
        infoPanel = paper.querySelector("div > div > div > div");
        break;
      }
    }
  }

  if (!infoPanel) {
    console.log("Não foi possível encontrar o painel de informações do dispositivo");
    return;
  }

  console.log("Painel de informações encontrado:", infoPanel);

  // Verificar se o painel já foi processado
  if (infoPanel.getAttribute('data-enhanced') === 'true') {
    return;
  }

  // Marcar o painel como processado
  infoPanel.setAttribute('data-enhanced', 'true');

  // Obter o ID do dispositivo selecionado
  const deviceId = getSelectedDeviceId();
  if (!deviceId) return;

  // Criar container para as informações adicionais
  const infoContainer = document.createElement('div');
  infoContainer.className = 'device-info-container';
  infoContainer.style.marginTop = '10px';
  infoContainer.style.padding = '10px';
  infoContainer.style.borderTop = '1px solid rgba(0, 0, 0, 0.12)';

  // Criar indicador de bateria
  const batteryInfo = document.createElement('div');
  batteryInfo.className = 'device-info-item battery-info';
  batteryInfo.style.display = 'flex';
  batteryInfo.style.alignItems = 'center';
  batteryInfo.style.marginBottom = '8px';
  batteryInfo.innerHTML = `
    <strong style="margin-right: 10px;">Bateria:</strong>
    <div class="battery-level" style="display: inline-block; width: 50px; height: 14px; border: 1px solid rgba(0, 0, 0, 0.3); border-radius: 2px; position: relative; margin-right: 8px;">
      <div class="battery-level-fill" style="position: absolute; left: 0; top: 0; bottom: 0; background-color: #4caf50; border-radius: 1px; width: 0%;"></div>
    </div>
    <span class="battery-value">Carregando...</span>
  `;

  // Criar indicador de velocidade
  const speedInfo = document.createElement('div');
  speedInfo.className = 'device-info-item speed-info';
  speedInfo.style.display = 'flex';
  speedInfo.style.alignItems = 'center';
  speedInfo.style.marginBottom = '8px';
  speedInfo.innerHTML = `
    <strong style="margin-right: 10px;">Velocidade:</strong>
    <span class="speed-value">Carregando...</span>
  `;

  // Criar indicador de endereço
  const addressInfo = document.createElement('div');
  addressInfo.className = 'device-info-item address-info';
  addressInfo.style.display = 'flex';
  addressInfo.style.alignItems = 'flex-start';
  addressInfo.style.marginBottom = '8px';
  addressInfo.innerHTML = `
    <strong style="margin-right: 10px;">Endereço:</strong>
    <span class="address-value" style="flex: 1; word-break: break-word;">Carregando...</span>
  `;

  // Adicionar os elementos ao container
  infoContainer.appendChild(batteryInfo);
  infoContainer.appendChild(speedInfo);
  infoContainer.appendChild(addressInfo);

  // Adicionar o container ao painel de informações
  infoPanel.appendChild(infoContainer);

  // Adicionar botão de bloqueio/desbloqueio
  const lockContainer = document.createElement('div');
  lockContainer.className = 'device-info-item lock-container';
  lockContainer.style.display = 'flex';
  lockContainer.style.alignItems = 'center';
  lockContainer.style.marginBottom = '8px';
  lockContainer.innerHTML = `
    <strong style="margin-right: 10px;">Controle:</strong>
  `;

  const lockButton = document.createElement('div');
  lockButton.className = 'lock-button unlocked';
  lockButton.setAttribute('data-deviceid', deviceId);
  lockButton.style.cursor = 'pointer';
  lockButton.style.padding = '6px';
  lockButton.style.borderRadius = '50%';
  lockButton.style.transition = 'background-color 0.2s';
  lockButton.style.display = 'flex';
  lockButton.style.alignItems = 'center';
  lockButton.style.justifyContent = 'center';
  lockButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
    </svg>
  `;

  // Adicionar evento de clique ao botão de bloqueio/desbloqueio
  lockButton.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleLockState(deviceId, lockButton);
  });

  lockContainer.appendChild(lockButton);
  infoContainer.appendChild(lockContainer);

  // Atualizar os dados do dispositivo
  updateDeviceInfoPanel(deviceId);
}

// Função para obter o ID do dispositivo selecionado
function getSelectedDeviceId() {
  // Tentar obter o ID do dispositivo selecionado na lista
  const selectedDevice = document.querySelector('.deviceList .MuiListItem-root.Mui-selected');
  if (selectedDevice) {
    return selectedDevice.getAttribute('data-deviceid');
  }

  // Se não encontrar na lista, tentar obter de outra forma (URL, etc.)
  const urlParams = new URLSearchParams(window.location.search);
  const deviceId = urlParams.get('deviceId');

  return deviceId;
}

// Função para melhorar a lista de dispositivos
function enhanceDeviceList() {
  const deviceItems = document.querySelectorAll('.deviceList .MuiListItem-root');

  deviceItems.forEach(function(item) {
    // Verificar se o item já foi processado
    if (item.getAttribute('data-enhanced') === 'true') {
      return;
    }

    // Marcar o item como processado
    item.setAttribute('data-enhanced', 'true');

    // Obter o ID do dispositivo
    const deviceId = item.getAttribute('data-deviceid');
    if (!deviceId) return;

    // Adicionar classe personalizada
    item.classList.add('device-list-item');

    // Obter os elementos existentes
    const deviceNameElement = item.querySelector('.MuiListItemText-primary');
    const deviceStatusElement = item.querySelector('.MuiListItemText-secondary');

    if (!deviceNameElement || !deviceStatusElement) return;

    // Obter o nome do dispositivo
    const deviceNameText = deviceNameElement.textContent;

    // Limpar o conteúdo atual do status
    deviceStatusElement.innerHTML = '';

    // Criar o container principal com layout de 3 linhas
    const mainContainer = document.createElement('div');
    mainContainer.className = 'device-container-3lines';
    mainContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      padding: 16px;
      min-height: 160px;
      justify-content: space-between;
      position: relative;
      background: white;
      border-radius: 8px;
      margin-bottom: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `;

    // LINHA 1: Nome do dispositivo + Status
    const line1 = document.createElement('div');
    line1.className = 'device-line1';
    line1.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    `;

    const deviceName = document.createElement('span');
    deviceName.className = 'device-name-new';
    deviceName.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      color: #000;
    `;
    deviceName.textContent = deviceNameText;

    const deviceStatus = document.createElement('span');
    deviceStatus.className = 'device-status-new';
    deviceStatus.style.cssText = `
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 10px;
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    `;
    deviceStatus.textContent = 'Online';

    line1.appendChild(deviceName);
    line1.appendChild(deviceStatus);

    // LINHA 2: Informações horizontais (velocidade, bateria, ignição, tempo)
    const line2 = document.createElement('div');
    line2.className = 'device-line2';
    line2.style.cssText = `
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #666;
      margin: 16px 0;
      gap: 16px;
    `;

    // Velocidade
    const speedInfo = document.createElement('span');
    speedInfo.className = 'speed-info-new';
    speedInfo.innerHTML = '⚡ 0 km/h';

    // Bateria
    const batteryInfo = document.createElement('span');
    batteryInfo.className = 'battery-info-new';
    batteryInfo.innerHTML = '🔋 N/A';

    // Ignição
    const ignitionInfo = document.createElement('span');
    ignitionInfo.className = 'ignition-info-new';
    ignitionInfo.innerHTML = '🔧 Desligado';

    // Tempo
    const timeInfo = document.createElement('span');
    timeInfo.className = 'time-info-new';
    timeInfo.innerHTML = '⏰ --';

    line2.appendChild(speedInfo);
    line2.appendChild(batteryInfo);
    line2.appendChild(ignitionInfo);
    line2.appendChild(timeInfo);

    // LINHA 3: Endereço
    const line3 = document.createElement('div');
    line3.className = 'device-line3';
    line3.style.cssText = `
      font-size: 13px;
      color: #888;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 8px;
    `;

    const addressElement = document.createElement('span');
    addressElement.className = 'device-address-new';
    addressElement.innerHTML = '📍 Carregando endereço...';

    line3.appendChild(addressElement);

    // Adicionar as linhas ao container principal
    mainContainer.appendChild(line1);
    mainContainer.appendChild(line2);
    mainContainer.appendChild(line3);

    // Adicionar o container ao elemento de status
    deviceStatusElement.appendChild(mainContainer);

    // Adicionar botão de bloqueio/desbloqueio ao container principal
    const lockButton = document.createElement('div');
    lockButton.className = 'lock-button unlocked';
    lockButton.setAttribute('data-deviceid', deviceId);
    lockButton.style.cssText = `
      position: absolute;
      top: 12px;
      right: 16px;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    `;
    lockButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" style="fill: #4caf50;">
        <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
      </svg>
    `;

    // Adicionar evento de clique ao botão de bloqueio/desbloqueio
    lockButton.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleLockState(deviceId, lockButton);
    });

    // Adicionar o botão ao container principal
    mainContainer.appendChild(lockButton);

    // Atualizar os dados do dispositivo
    updateDeviceData(deviceId);
  });
}

// Função para alternar o estado de bloqueio/desbloqueio
function toggleLockState(deviceId, button) {
  const isLocked = button.classList.contains('locked');
  const commandType = isLocked ? 'engineResume' : 'engineStop';

  // Enviar comando para o servidor
  fetch('/api/commands', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deviceId: parseInt(deviceId),
      type: commandType
    })
  })
  .then(response => {
    if (response.ok) {
      // Atualizar o estado visual do botão
      if (isLocked) {
        button.classList.remove('locked');
        button.classList.add('unlocked');
        button.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
          </svg>
        `;
      } else {
        button.classList.remove('unlocked');
        button.classList.add('locked');
        button.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        `;
      }
    }
  })
  .catch(error => {
    console.error('Erro ao enviar comando:', error);
  });
}

// Função para atualizar os dados do dispositivo
function updateDeviceData(deviceId) {
  // Obter a posição atual do dispositivo
  fetch(`/api/positions?deviceId=${deviceId}`)
    .then(response => response.json())
    .then(positions => {
      if (positions && positions.length > 0) {
        const position = positions[0];
        updateDeviceUI(deviceId, position);
        updateDeviceInfoPanel(deviceId, position);
      }
    })
    .catch(error => {
      console.error('Erro ao obter posição:', error);
    });
}

// Função para atualizar o painel de informações do dispositivo
function updateDeviceInfoPanel(deviceId, position) {
  // Se a posição não foi fornecida, buscar a posição atual
  if (!position) {
    fetch(`/api/positions?deviceId=${deviceId}`)
      .then(response => response.json())
      .then(positions => {
        if (positions && positions.length > 0) {
          updateDeviceInfoPanel(deviceId, positions[0]);
        }
      })
      .catch(error => {
        console.error('Erro ao obter posição:', error);
      });
    return;
  }

  // Tentar encontrar o elemento com o seletor específico
  let infoPanel = document.querySelector("#root > div.jss1 > div > div > div.jss48 > div.MuiPaper-root.MuiPaper-elevation.MuiPaper-elevation1.jss50.muiltr-ma8f29 > div > div > div > div");

  // Se não encontrar, tentar um seletor mais genérico
  if (!infoPanel) {
    infoPanel = document.querySelector(".MuiPaper-root > div > div > div > div");
  }

  // Se ainda não encontrar, tentar outro seletor
  if (!infoPanel) {
    infoPanel = document.querySelector(".devicePositionPanel");
  }

  // Último recurso: procurar por qualquer div que possa conter as informações do dispositivo
  if (!infoPanel) {
    const papers = document.querySelectorAll(".MuiPaper-root");
    for (const paper of papers) {
      if (paper.textContent.includes("Velocidade") || paper.textContent.includes("Altitude") || paper.textContent.includes("Curso")) {
        infoPanel = paper.querySelector("div > div > div > div");
        break;
      }
    }
  }

  if (!infoPanel) {
    console.log("Não foi possível encontrar o painel de informações do dispositivo para atualização");
    return;
  }

  // Atualizar bateria
  const batteryValue = position.attributes.battery;
  const batteryElement = infoPanel.querySelector('.battery-value');
  const batteryFill = infoPanel.querySelector('.battery-level-fill');

  if (batteryValue !== undefined && batteryElement && batteryFill) {
    batteryElement.textContent = `${Math.round(batteryValue)}%`;
    batteryFill.style.width = `${batteryValue}%`;

    // Atualizar cor com base no nível de bateria
    batteryFill.style.backgroundColor = batteryValue < 20 ? '#f44336' : batteryValue < 50 ? '#ff9800' : '#4caf50';
  }

  // Atualizar velocidade
  const speed = position.speed !== undefined ? position.speed * 1.852 : 0; // Converter de nós para km/h
  const speedElement = infoPanel.querySelector('.speed-value');

  if (speedElement) {
    speedElement.textContent = `${Math.round(speed)} km/h`;
  }

  // Atualizar endereço
  const address = position.address || 'Endereço desconhecido';
  const addressElement = infoPanel.querySelector('.address-value');

  if (addressElement) {
    addressElement.textContent = address;
  }

  // Atualizar o estado do botão de bloqueio/desbloqueio com base no status atual
  // Aqui você pode adicionar lógica para verificar o status atual do dispositivo
  // e atualizar o botão de bloqueio/desbloqueio de acordo
}

// Função para atualizar a interface do dispositivo com os dados da posição
function updateDeviceUI(deviceId, position) {
  const deviceItem = document.querySelector(`.deviceList .MuiListItem-root[data-deviceid="${deviceId}"]`);
  if (!deviceItem) return;

  // Atualizar status online/offline na nova estrutura
  const deviceStatusNew = deviceItem.querySelector('.device-status-new');
  if (deviceStatusNew) {
    const isOnline = position.attributes.online !== false;
    const statusText = isOnline ? 'Online' : 'Offline';
    const statusColor = isOnline ? '#4caf50' : '#f44336';
    const bgColor = isOnline ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';

    deviceStatusNew.textContent = statusText;
    deviceStatusNew.style.color = statusColor;
    deviceStatusNew.style.backgroundColor = bgColor;
  }

  // Atualizar endereço no novo layout
  const addressElementNew = deviceItem.querySelector('.device-address-new');
  if (addressElementNew) {
    const address = position.address || 'Endereço desconhecido';
    addressElementNew.innerHTML = `📍 ${address}`;
    addressElementNew.title = address;
  }

  // Atualizar velocidade na nova estrutura
  const speed = position.speed !== undefined ? position.speed * 1.852 : 0;
  const speedInfoNew = deviceItem.querySelector('.speed-info-new');
  if (speedInfoNew) {
    speedInfoNew.innerHTML = `⚡ ${Math.round(speed)} km/h`;
  }

  // Atualizar bateria na nova estrutura
  const batteryValue = position.attributes.batteryLevel || position.attributes.battery;
  const batteryInfoNew = deviceItem.querySelector('.battery-info-new');
  if (batteryInfoNew && batteryValue !== undefined) {
    const isCharging = position.attributes.charge;
    const batteryIcon = isCharging ? '🔌' : '🔋';
    batteryInfoNew.innerHTML = `${batteryIcon} ${Math.round(batteryValue)}%`;
  }

  // Atualizar ignição na nova estrutura
  const ignitionInfoNew = deviceItem.querySelector('.ignition-info-new');
  if (ignitionInfoNew) {
    const ignition = position.attributes.ignition;
    ignitionInfoNew.innerHTML = `🔧 ${ignition ? 'Ligado' : 'Desligado'}`;
  }

  // Atualizar o estado do botão de bloqueio/desbloqueio baseado na ignição
  const lockButton = deviceItem.querySelector('.lock-button');
  if (lockButton) {
    const ignition = position.attributes.ignition;
    const isLocked = !ignition; // Se ignição está desligada, consideramos bloqueado

    if (isLocked) {
      lockButton.classList.remove('unlocked');
      lockButton.classList.add('locked');
      lockButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" style="fill: #f44336;">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
        </svg>
      `;
    } else {
      lockButton.classList.remove('locked');
      lockButton.classList.add('unlocked');
      lockButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" style="fill: #4caf50;">
          <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
        </svg>
      `;
    }
  }

  // Atualizar tempo na nova estrutura
  const timeInfoNew = deviceItem.querySelector('.time-info-new');
  if (timeInfoNew && position.fixTime) {
    const now = new Date();
    const fixTime = new Date(position.fixTime);
    const diffMs = now - fixTime;
    const diffMins = Math.floor(diffMs / 60000);

    let timeText;
    if (diffMins < 1) {
      timeText = 'agora';
    } else if (diffMins < 60) {
      timeText = `${diffMins} min`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      timeText = `${hours}h`;
    } else {
      const days = Math.floor(diffMins / 1440);
      timeText = `${days} dias`;
    }

    timeInfoNew.innerHTML = `⏰ ${timeText}`;
  }

  // Atualizar movimento
  const movementElement = deviceItem.querySelector('.movement-value');
  if (movementElement) {
    const motion = position.attributes.motion;
    movementElement.textContent = motion ? 'Em movimento' : 'Fora';
    movementElement.className = motion ? 'movement-value status-medium' : 'movement-value';
  }

  // Atualizar status geral
  const statusValueElement = deviceItem.querySelector('.status-value');
  if (statusValueElement) {
    // Determinar o status geral com base em vários fatores
    let statusText = 'Bom';
    let statusClass = 'status-good';

    // Verificar bateria baixa
    if (batteryValue !== undefined && batteryValue < 20) {
      statusText = 'Bateria baixa';
      statusClass = 'status-bad';
    }

    // Verificar outros problemas potenciais
    // Adicione mais condições conforme necessário

    statusValueElement.textContent = statusText;
    statusValueElement.className = `status-value ${statusClass}`;
  }
}

// Função para atualizar as informações no cabeçalho
function updateHeaderInfo(deviceId, position) {
  // Se a posição não foi fornecida, buscar a posição atual
  if (!position) {
    fetch(`/api/positions?deviceId=${deviceId}`)
      .then(response => response.json())
      .then(positions => {
        if (positions && positions.length > 0) {
          updateHeaderInfo(deviceId, positions[0]);
        }
      })
      .catch(error => {
        console.error('Erro ao obter posição para o cabeçalho:', error);
      });
    return;
  }

  // Procurar pelo elemento do cabeçalho
  const headerElements = document.querySelectorAll('.MuiToolbar-root');
  let userHeader = null;

  for (const header of headerElements) {
    if (header.textContent.includes('ALEQUIZAO') || header.textContent.includes('Conectado')) {
      userHeader = header;
      break;
    }
  }

  if (!userHeader) return;

  // Atualizar endereço
  const address = position.address || 'Endereço desconhecido';
  const addressElement = userHeader.querySelector('.header-address');

  if (addressElement) {
    addressElement.textContent = address;
    addressElement.title = address; // Mostrar o endereço completo ao passar o mouse
  }

  // Atualizar bateria
  const batteryValue = position.attributes.battery;
  const batteryElement = userHeader.querySelector('.header-battery-value');

  if (batteryValue !== undefined && batteryElement) {
    batteryElement.textContent = `${Math.round(batteryValue)}%`;

    // Atualizar cor com base no nível de bateria
    const batteryContainer = userHeader.querySelector('.header-battery');
    if (batteryContainer) {
      if (batteryValue < 20) {
        batteryContainer.style.color = '#f44336'; // Vermelho
      } else if (batteryValue < 50) {
        batteryContainer.style.color = '#ff9800'; // Laranja
      } else {
        batteryContainer.style.color = '#4caf50'; // Verde
      }
    }
  }

  // Atualizar velocidade
  const speed = position.speed !== undefined ? position.speed * 1.852 : 0; // Converter de nós para km/h
  const speedElement = userHeader.querySelector('.header-speed-value');

  if (speedElement) {
    speedElement.textContent = `${Math.round(speed)} km/h`;

    // Destacar se estiver em movimento
    const speedContainer = userHeader.querySelector('.header-speed');
    if (speedContainer && speed > 0) {
      speedContainer.style.color = '#ff9800'; // Laranja
    } else if (speedContainer) {
      speedContainer.style.color = '#e0e0e0'; // Cinza
    }
  }

  // Atualizar status geral
  const statusElement = userHeader.querySelector('.header-status-value');
  const statusContainer = userHeader.querySelector('.header-status');

  if (statusElement && statusContainer) {
    // Determinar o status geral com base em vários fatores
    let statusText = 'Bom';
    let statusColor = '#4caf50'; // Verde

    // Verificar bateria baixa
    if (batteryValue !== undefined && batteryValue < 20) {
      statusText = 'Bateria baixa';
      statusColor = '#f44336'; // Vermelho
    }

    // Verificar outros problemas potenciais
    // Adicione mais condições conforme necessário

    statusElement.textContent = statusText;
    statusContainer.style.color = statusColor;
  }
}

// Função para adicionar listener para eventos de WebSocket
function addWebSocketListener() {
  // Verificar se já existe uma conexão WebSocket
  const originalWebSocket = WebSocket;

  // Sobrescrever o construtor do WebSocket
  window.WebSocket = function(url, protocols) {
    const socket = new originalWebSocket(url, protocols);

    // Adicionar listener para mensagens
    socket.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);

        // Verificar se há posições atualizadas
        if (data.positions && data.positions.length > 0) {
          data.positions.forEach(position => {
            updateDeviceUI(position.deviceId, position);

            // Verificar se o dispositivo atualizado é o dispositivo selecionado
            const selectedDeviceId = getSelectedDeviceId();
            if (selectedDeviceId && position.deviceId.toString() === selectedDeviceId.toString()) {
              updateDeviceInfoPanel(position.deviceId, position);
              updateHeaderInfo(position.deviceId, position);
            }
          });
        }
      } catch (e) {
        console.error('Erro ao processar mensagem WebSocket:', e);
      }
    });

    return socket;
  };

  // Manter as propriedades do WebSocket original
  window.WebSocket.prototype = originalWebSocket.prototype;
  window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
  window.WebSocket.OPEN = originalWebSocket.OPEN;
  window.WebSocket.CLOSING = originalWebSocket.CLOSING;
  window.WebSocket.CLOSED = originalWebSocket.CLOSED;
}

class WelcomeModal {
  constructor() {
    this.modalSettings = null;
    this.init();
  }

  async init() {
    try {
      const shopDomain = Shopify.shop;
      const response = await fetch(`https://shopify.moxxy.com.br/api/modal-settings/${shopDomain}`);
      this.modalSettings = await response.json();
      
      if (this.modalSettings && this.modalSettings.active) {
        this.createModal();
      }
    } catch (error) {
      console.error('Error initializing modal:', error);
    }
  }

  createModal() {
    const modalHtml = `
      <div id="welcome-modal" class="welcome-modal">
        <div class="welcome-modal-content">
          <h2>${this.modalSettings.title}</h2>
          <p>${this.modalSettings.content}</p>
          <button onclick="welcomeModal.closeModal()">${this.modalSettings.button_text}</button>
        </div>
      </div>
    `;

    const modalStyles = `
      <style>
        .welcome-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          z-index: 9999;
        }
        .welcome-modal-content {
          background-color: white;
          margin: 15% auto;
          padding: 20px;
          width: 80%;
          max-width: 500px;
          border-radius: 8px;
          text-align: center;
        }
        .welcome-modal button {
          padding: 10px 20px;
          background-color: #000;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 15px;
        }
        .welcome-modal button:hover {
          opacity: 0.8;
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.head.insertAdjacentHTML('beforeend', modalStyles);
    
    setTimeout(() => {
      document.getElementById('welcome-modal').style.display = 'block';
    }, 1000);
  }

  closeModal() {
    document.getElementById('welcome-modal').style.display = 'none';
  }
}

const welcomeModal = new WelcomeModal();

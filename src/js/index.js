// src/js/index.js
import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const clientForm = document.getElementById("clientForm");
  const drawerToggle = document.getElementById("drawer-toggle");
  const noPaymentsMessage = document.getElementById("no-payments-message");
  
  // Close drawer when clicking menu items on mobile
  const menuItems = document.querySelectorAll(".drawer-side .menu a");
  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 1024) { // lg breakpoint in Tailwind
        drawerToggle.checked = false;
      }
    });
  });

  // Payment entries array to store multiple payments
  let payments = [];

  // Elements for Payment entries
  const paymentAmountInput = document.getElementById("paymentAmountInput");
  const paymentDateInput = document.getElementById("paymentDateInput");
  const addPaymentBtn = document.getElementById("addPaymentBtn");
  const paymentsList = document.getElementById("paymentsList");

  // Set today's date as default for payment date
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  paymentDateInput.value = formattedDate;

  // Handle "Add Payment" button click
  addPaymentBtn.addEventListener("click", () => {
    const amount = paymentAmountInput.value.trim();
    const date = paymentDateInput.value.trim();

    if (!amount || !date) {
      // Show error toast
      showToast('Please enter both a payment amount and a payment date.', 'error');
      return;
    }

    // Create a payment entry and add to the payments array
    const paymentEntry = { amount: Number(amount), date };
    payments.push(paymentEntry);

    // Update the displayed list of payments
    renderPaymentsList();
    
    // Clear the input fields but keep the date as today
    paymentAmountInput.value = "";
    
    // Show success toast
    showToast('Payment added successfully!', 'success');
    
    // Focus back on amount input for quick entry of multiple payments
    paymentAmountInput.focus();
  });

  // Render the list of added payment entries
  function renderPaymentsList() {
    // Handle no payments state
    if (payments.length === 0) {
      noPaymentsMessage.classList.remove('hidden');
      paymentsList.querySelectorAll('.payment-item').forEach(item => item.remove());
      return;
    }
    
    // Hide no payments message
    noPaymentsMessage.classList.add('hidden');
    
    // Clear existing payment items
    paymentsList.querySelectorAll('.payment-item').forEach(item => item.remove());
    
    // Add new payment items
    payments.forEach((payment, index) => {
      const paymentDate = new Date(payment.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const paymentItem = document.createElement("div");
      paymentItem.classList.add("payment-item", "flex", "items-center", "justify-between", "p-2", "bg-base-100", "rounded-lg", "shadow-sm");
      paymentItem.innerHTML = `
        <div class="flex items-center">
          <div class="avatar placeholder mr-2">
            <div class="bg-success text-success-content rounded-full w-8">
              <span>$</span>
            </div>
          </div>
          <div>
            <div class="font-medium">$${payment.amount.toFixed(2)}</div>
            <div class="text-xs opacity-70">${paymentDate}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm btn-circle" data-index="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      `;
      paymentsList.appendChild(paymentItem);
    });

    // Add event listeners to remove buttons
    paymentsList.querySelectorAll(".payment-item button").forEach(button => {
      button.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-index"));
        
        // Remove with animation
        const itemToRemove = e.currentTarget.closest('.payment-item');
        itemToRemove.classList.add('opacity-0');
        
        setTimeout(() => {
          payments.splice(idx, 1);
          renderPaymentsList();
        }, 300);
        
        // Show remove toast
        showToast('Payment removed', 'info');
      });
    });
  }

  // Show toast notification
  function showToast(message, type = 'info') {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-end z-50';
    
    let alertClass, icon;
    switch(type) {
      case 'success':
        alertClass = 'alert-success';
        icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />';
        break;
      case 'error':
        alertClass = 'alert-error';
        icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />';
        break;
      case 'info':
      default:
        alertClass = 'alert-info';
        icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />';
        break;
    }
    
    toast.innerHTML = `
      <div class="alert ${alertClass}">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          ${icon}
        </svg>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Handle form submission
  clientForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Show loading indicator
    const submitBtn = e.submitter;
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="loading loading-spinner loading-sm"></span>
      Saving...
    `;

    try {
      // Gather client personal details
      const clientName = document.getElementById("clientName").value;
      const clientAge = document.getElementById("clientAge").value;
      const clientGender = document.getElementById("clientGender").value;
      const clientContact = document.getElementById("clientContact").value;
      const clientBusinessNumber = document.getElementById("clientBusinessNumber").value;

      // Gather address information
      const city = document.getElementById("city").value;
      const district = document.getElementById("district").value;
      const state = document.getElementById("state").value;
      const country = document.getElementById("country").value;

      // Gather business information
      const businessName = document.getElementById("businessName").value;
      const businessAddress = document.getElementById("businessAddress").value;
      const businessPhone = document.getElementById("businessPhone").value;
      const businessWhatsapp = document.getElementById("businessWhatsapp").value;
      const serviceType = document.getElementById("serviceType").value;
      const serviceStatus = document.getElementById("serviceStatus").value;
      const paymentMethod = document.getElementById("paymentMethod").value;

      // Capture current timestamp for entryDate and createdAt
      const entryDate = new Date().toISOString();

      // Add the new client with payments array inside the businessInfo object
      const docRef = await addDoc(collection(db, "clients"), {
        personalDetails: {
          name: clientName,
          age: clientAge,
          gender: clientGender,
          contactNumber: clientContact,
          businessNumber: clientBusinessNumber,
        },
        address: {
          city,
          district,
          state,
          country,
        },
        businessInfo: {
          businessName,
          businessAddress,
          businessPhone,
          businessWhatsapp,
          serviceType,
          serviceStatus,
          paymentMethod,
          // Include the payments array
          payments,
          entryDate
        },
        // Top-level status field for filtering purposes
        status: serviceStatus,
        createdAt: entryDate
      });

      // Show success message
      showToast(`Client "${clientName}" added successfully!`, 'success');
      
      // Reset form after a short delay
      setTimeout(() => {
        clientForm.reset();
        payments = [];
        renderPaymentsList();
        
        // Set today's date again for payment date
        paymentDateInput.value = formattedDate;
        
        // Reset to step 1
        const formSteps = [
          document.getElementById('step-1'),
          document.getElementById('step-2'),
          document.getElementById('step-3'),
          document.getElementById('step-4')
        ];
        
        formSteps.forEach(step => step.classList.add('hidden'));
        formSteps[0].classList.remove('hidden');
        
        // Update step indicators
        const stepIndicators = [
          document.getElementById('step-1-indicator'),
          document.getElementById('step-2-indicator'),
          document.getElementById('step-3-indicator'),
          document.getElementById('step-4-indicator')
        ];
        
        stepIndicators.forEach((indicator, index) => {
          if (index === 0) {
            indicator.classList.add('step-primary');
          } else {
            indicator.classList.remove('step-primary');
          }
        });
        
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
        
        // Show success alert with link to dashboard
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success max-w-md mx-auto fixed bottom-4 left-1/2 transform -translate-x-1/2 shadow-xl z-50';
        successAlert.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="font-bold">Client added successfully!</h3>
            <div class="text-xs">Client ID: ${docRef.id}</div>
          </div>
          <a href="dashboard.html" class="btn btn-sm">View Dashboard</a>
        `;
        
        document.body.appendChild(successAlert);
        
        // Remove alert after 5 seconds
        setTimeout(() => {
          successAlert.classList.add('opacity-0');
          setTimeout(() => {
            successAlert.remove();
          }, 300);
        }, 5000);
        
      }, 1000);
    } catch (error) {
      console.error("Error adding client: ", error);
      
      // Show error message
      showToast("Error adding client. Please try again.", 'error');
      
      // Restore button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
  });

  // Mobile responsiveness handlers
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) { // lg breakpoint
      drawerToggle.checked = false;
    }
  });
});
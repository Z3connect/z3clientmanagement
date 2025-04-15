// src/js/view-client.js
import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Utility to get a URL query parameter
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
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
    case 'warning':
      alertClass = 'alert-warning';
      icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />';
      break;
    case 'info':
    default:
      alertClass = 'alert-info';
      icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />';
      break;
  }
  
  toast.innerHTML = `
    <div class="alert ${alertClass} shadow-lg">
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

document.addEventListener("DOMContentLoaded", async () => {
  const clientId = getQueryParam("id");
  const clientDetailsDiv = document.getElementById("clientDetails");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const mainContent = document.getElementById("mainContent");
  const errorContent = document.getElementById("errorContent");
  const errorMessage = document.getElementById("errorMessage");
  const deleteModal = document.getElementById('delete-confirm-modal');
  
  // Set today's date as default for new payment date
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  if (!clientId) {
    loadingSpinner.classList.add("hidden");
    errorContent.classList.remove("hidden");
    errorMessage.textContent = "No client ID provided.";
    return;
  }

  const clientRef = doc(db, "clients", clientId);
  let existingPayments = []; // Holds the payments originally saved in Firestore
  let newPayments = []; // Holds any new payment entries added during edit

  try {
    const docSnap = await getDoc(clientRef);
    if (!docSnap.exists()) {
      loadingSpinner.classList.add("hidden");
      errorContent.classList.remove("hidden");
      errorMessage.textContent = "No such client exists.";
      return;
    }
    
    const client = docSnap.data();
    existingPayments = Array.isArray(client.businessInfo?.payments)
      ? client.businessInfo.payments
      : [];
    
    // Hide loading, show content
    loadingSpinner.classList.add("hidden");
    mainContent.classList.remove("hidden");
    
    // Render client details
    renderClientDetails(client);
    
  } catch (error) {
    console.error("Error fetching client:", error);
    loadingSpinner.classList.add("hidden");
    errorContent.classList.remove("hidden");
    errorMessage.textContent = "Error loading client details: " + error.message;
  }

  // Render the view and edit sections, including Payment History
  function renderClientDetails(client) {
    // Determine client status for badge
    let statusBadge = '';
    const status = client.status || client.businessInfo?.serviceStatus || "N/A";
    
    if (status === "Active") {
      statusBadge = `<div class="badge badge-success gap-1"><span class="bg-white rounded-full h-2 w-2"></span> Active</div>`;
    } else if (status === "Pending") {
      statusBadge = `<div class="badge badge-warning gap-1"><span class="bg-white rounded-full h-2 w-2"></span> Pending</div>`;
    } else if (status === "Deactive") {
      statusBadge = `<div class="badge badge-error gap-1"><span class="bg-white rounded-full h-2 w-2"></span> Deactive</div>`;
    } else {
      statusBadge = `<div class="badge badge-ghost">${status}</div>`;
    }

    // Format the entry date
    const entryDate = client.businessInfo?.entryDate
      ? new Date(client.businessInfo.entryDate).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : "Not specified";

    // Render the Payment History table for existing payments
    const paymentHistoryHTML = existingPayments.length
      ? `<div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${existingPayments
                .map(
                  payment => `<tr>
                    <td class="font-medium">$${Number(payment.amount).toFixed(2)}</td>
                    <td>${new Date(payment.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
         </div>`
      : `<div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>No payment history found for this client.</span>
        </div>`;

    // Calculate total payments
    const totalPayments = existingPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    clientDetailsDiv.innerHTML = `
      <div class="card-body p-0">
        <!-- Tabs for View/Edit Modes -->
        <div class="tabs bg-base-300 rounded-t-xl">
          <a class="tab tab-lifted tab-active" id="viewTab">View Client</a>
          <a class="tab tab-lifted" id="editTab">Edit Client</a>
        </div>
        
        <!-- VIEW MODE -->
        <div id="viewMode" class="p-6">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h2 class="text-2xl font-bold">${client.personalDetails?.name || 'Unknown'}</h2>
              <p class="text-base-content/70">${client.businessInfo?.businessName || 'No Business Name'}</p>
            </div>
            <div class="mt-2 md:mt-0 flex items-center gap-2">
              ${statusBadge}
            </div>
          </div>
          
          <div class="divider"></div>
          
          <!-- Client Information Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Personal Details -->
            <div class="card bg-base-200">
              <div class="card-body">
                <h3 class="card-title flex items-center text-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 text-primary">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Personal Information
                </h3>
                <div class="space-y-1">
                  <div class="flex">
                    <span class="text-base-content/70 w-24">Age:</span>
                    <span>${client.personalDetails?.age || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-24">Gender:</span>
                    <span>${client.personalDetails?.gender || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-24">Contact:</span>
                    <span>${client.personalDetails?.contactNumber || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-24">Business #:</span>
                    <span>${client.personalDetails?.businessNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Address -->
            <div class="card bg-base-200">
              <div class="card-body">
                <h3 class="card-title flex items-center text-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 text-primary">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Address Information
                </h3>
                <div class="space-y-1">
                  <div class="flex">
                    <span class="text-base-content/70 w-24">City:</span>
                    <span>${client.address?.city || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-24">District:</span>
                    <span>${client.address?.district || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-24">State:</span>
                    <span>${client.address?.state || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-24">Country:</span>
                    <span>${client.address?.country || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Business Information -->
            <div class="card bg-base-200 md:col-span-2">
              <div class="card-body">
                <h3 class="card-title flex items-center text-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 text-primary">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                  Business Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="flex">
                    <span class="text-base-content/70 w-36">Business Name:</span>
                    <span>${client.businessInfo?.businessName || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-36">Business Address:</span>
                    <span>${client.businessInfo?.businessAddress || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-36">Business Phone:</span>
                    <span>${client.businessInfo?.businessPhone || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-36">Business WhatsApp:</span>
                    <span>${client.businessInfo?.businessWhatsapp || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-36">Service Type:</span>
                    <span>${client.businessInfo?.serviceType || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-36">Service Status:</span>
                    <span>${client.businessInfo?.serviceStatus || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-36">Payment Method:</span>
                    <span>${client.businessInfo?.paymentMethod || 'N/A'}</span>
                  </div>
                  <div class="flex">
                    <span class="text-base-content/70 w-36">Entry Date:</span>
                    <span>${entryDate}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Payment Information -->
            <div class="card bg-base-200 md:col-span-2">
              <div class="card-body">
                <div class="flex justify-between items-center">
                  <h3 class="card-title flex items-center text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 text-primary">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                    Payment History
                  </h3>
                  <div class="stat-value text-success text-xl">$${totalPayments.toFixed(2)}</div>
                </div>
                
                ${paymentHistoryHTML}
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="mt-6 flex justify-end gap-2">
            <button id="deleteBtn" class="btn btn-error">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
            <button id="editBtn" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      
        <!-- EDIT MODE -->
        <div id="editMode" class="p-6 hidden">
          <form id="editForm" class="space-y-6">
            <!-- Edit Form Tabs -->
            <div class="tabs tabs-boxed">
              <a class="tab tab-active" id="personalTab">Personal</a>
              <a class="tab" id="addressTab">Address</a>
              <a class="tab" id="businessTab">Business</a>
              <a class="tab" id="paymentsTab">Payments</a>
            </div>
            
            <!-- Personal Details Tab Content -->
            <div id="personalTabContent" class="space-y-4">
              <h3 class="font-semibold text-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 text-primary">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Personal Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label" for="editName">
                    <span class="label-text">Full Name</span>
                    <span class="label-text-alt text-error">*Required</span>
                  </label>
                  <input type="text" id="editName" class="input input-bordered" value="${client.personalDetails?.name || ''}" required>
                </div>
                <div class="form-control">
                  <label class="label" for="editAge">
                    <span class="label-text">Age</span>
                  </label>
                  <input type="number" id="editAge" class="input input-bordered" value="${client.personalDetails?.age || ''}">
                </div>
                <div class="form-control">
                  <label class="label" for="editGender">
                    <span class="label-text">Gender</span>
                  </label>
                  <select id="editGender" class="select select-bordered">
                    <option value="" ${!client.personalDetails?.gender ? 'selected' : ''}>Select gender</option>
                    <option value="Male" ${client.personalDetails?.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${client.personalDetails?.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Other" ${client.personalDetails?.gender === 'Other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
                <div class="form-control">
                  <label class="label" for="editContact">
                    <span class="label-text">Contact Number</span>
                    <span class="label-text-alt text-error">*Required</span>
                  </label>
                  <input type="tel" id="editContact" class="input input-bordered" value="${client.personalDetails?.contactNumber || ''}" required>
                </div>
                <div class="form-control md:col-span-2">
                  <label class="label" for="editBusinessNumber">
                    <span class="label-text">Business Number</span>
                    <span class="label-text-alt">(Optional)</span>
                  </label>
                  <input type="text" id="editBusinessNumber" class="input input-bordered" value="${client.personalDetails?.businessNumber || ''}">
                </div>
              </div>
            </div>
            
            <!-- Address Tab Content -->
            <div id="addressTabContent" class="space-y-4 hidden">
              <h3 class="font-semibold text-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 text-primary">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Address Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label" for="editCity">
                    <span class="label-text">City</span>
                  </label>
                  <input type="text" id="editCity" class="input input-bordered" value="${client.address?.city || ''}">
                </div>
                <div class="form-control">
                  <label class="label" for="editDistrict">
                    <span class="label-text">District</span>
                  </label>
                  <input type="text" id="editDistrict" class="input input-bordered" value="${client.address?.district || ''}">
                </div>
                <div class="form-control">
                  <label class="label" for="editState">
                    <span class="label-text">State</span>
                  </label>
                  <input type="text" id="editState" class="input input-bordered" value="${client.address?.state || ''}">
                </div>
                <div class="form-control">
                  <label class="label" for="editCountry">
                    <span class="label-text">Country</span>
                  </label>
                  <input type="text" id="editCountry" class="input input-bordered" value="${client.address?.country || ''}">
                </div>
              </div>
            </div>
            
            <!-- Business Tab Content -->
            <div id="businessTabContent" class="space-y-4 hidden">
              <h3 class="font-semibold text-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 text-primary">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
                Business Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label" for="editBusinessName">
                    <span class="label-text">Business Name</span>
                    <span class="label-text-alt text-error">*Required</span>
                  </label>
                  <input type="text" id="editBusinessName" class="input input-bordered" value="${client.businessInfo?.businessName || ''}" required>
                </div>
                <div class="form-control">
                  <label class="label" for="editBusinessAddress">
                    <span class="label-text">Business Address</span>
                    <span class="label-text-alt text-error">*Required</span>
                  </label>
                  <input type="text" id="editBusinessAddress" class="input input-bordered" value="${client.businessInfo?.businessAddress || ''}" required>
                </div>
                <div class="form-control">
                  <label class="label" for="editBusinessPhone">
                    <span class="label-text">Business Phone</span>
                    <span class="label-text-alt text-error">*Required</span>
                  </label>
                  <input type="tel" id="editBusinessPhone" class="input input-bordered" value="${client.businessInfo?.businessPhone || ''}" required>
                </div>
                <div class="form-control">
                  <label class="label" for="editBusinessWhatsapp">
                    <span class="label-text">Business WhatsApp</span>
                    <span class="label-text-alt text-error">*Required</span>
                  </label>
                  <input type="tel" id="editBusinessWhatsapp" class="input input-bordered" value="${client.businessInfo?.businessWhatsapp || ''}" required>
                </div>
                <div class="form-control">
                  <label class="label" for="editServiceType">
                    <span class="label-text">Service Type</span>
                    <span class="label-text-alt text-error">*Required</span>
                  </label>
                  <input type="text" id="editServiceType" class="input input-bordered" value="${client.businessInfo?.serviceType || ''}" required>
                </div>
                <div class="form-control">
                  <label class="label" for="editServiceStatus">
                    <span class="label-text">Service Status</span>
                    <span class="label-text-alt text-error">*Required</span>
                  </label>
                  <select id="editServiceStatus" class="select select-bordered" required>
                    <option value="" ${!client.businessInfo?.serviceStatus ? 'selected' : ''}>Select status</option>
                    <option value="Active" ${client.businessInfo?.serviceStatus === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Deactive" ${client.businessInfo?.serviceStatus === 'Deactive' ? 'selected' : ''}>Deactive</option>
                    <option value="Pending" ${client.businessInfo?.serviceStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                  </select>
                </div>
                <div class="form-control">
                  <label class="label" for="editPaymentMethod">
                    <span class="label-text">Payment Method</span>
                    <span class="label-text-alt text-error">*Required</span>
                  </label>
                  <select id="editPaymentMethod" class="select select-bordered" required>
                    <option value="" ${!client.businessInfo?.paymentMethod ? 'selected' : ''}>Select payment method</option>
                    <option value="GPay" ${client.businessInfo?.paymentMethod === 'GPay' ? 'selected' : ''}>GPay</option>
                    <option value="Cash" ${client.businessInfo?.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                    <option value="Bank" ${client.businessInfo?.paymentMethod === 'Bank' ? 'selected' : ''}>Bank</option>
                    <option value="Other" ${client.businessInfo?.paymentMethod === 'Other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Payments Tab Content -->
            <div id="paymentsTabContent" class="space-y-4 hidden">
              <h3 class="font-semibold text-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 text-primary">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
                Payments Management
              </h3>
              
              <!-- Existing Payments -->
              <div class="card bg-base-200">
                <div class="card-body">
                  <h4 class="font-medium">Existing Payments</h4>
                  <div id="existingPaymentsTable">
                    ${paymentHistoryHTML}
                  </div>
                </div>
              </div>
              
              <!-- Add New Payment -->
              <div class="card bg-base-200">
                <div class="card-body">
                  <h4 class="font-medium">Add New Payment</h4>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div class="form-control">
                      <label class="label" for="newPaymentAmount">
                        <span class="label-text">Payment Amount</span>
                      </label>
                      <div class="input-group">
                        <span>$</span>
                        <input type="number" id="newPaymentAmount" class="input input-bordered w-full" placeholder="0.00" step="0.01">
                      </div>
                    </div>
                    <div class="form-control">
                      <label class="label" for="newPaymentDate">
                        <span class="label-text">Payment Date</span>
                      </label>
                      <input type="date" id="newPaymentDate" class="input input-bordered w-full" value="${formattedDate}">
                    </div>
                    <div class="form-control flex">
                      <label class="label opacity-0">
                        <span class="label-text">Add</span>
                      </label>
                      <button type="button" id="addNewPaymentBtn" class="btn btn-success h-12">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Payment
                      </button>
                    </div>
                  </div>
                  
                  <!-- New Payments List -->
                  <div class="mt-4">
                    <div id="newPaymentsList" class="space-y-2">
                      <!-- No payments message (will be hidden when payments are added) -->
                      <div id="no-new-payments-message" class="text-center py-4 text-base-content/70">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        <p>No new payments added yet</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Edit Form Buttons -->
            <div class="flex justify-end gap-2 mt-6">
              <button type="button" id="cancelEdit" class="btn btn-ghost">Cancel</button>
              <button type="submit" id="saveBtn" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    addEventListeners();
  }

  // Attach event listeners for edit, adding new payments, cancel, save, and delete actions
  function addEventListeners() {
    // Tab switching in view/edit mode
    const viewTab = document.getElementById("viewTab");
    const editTab = document.getElementById("editTab");
    const viewMode = document.getElementById("viewMode");
    const editMode = document.getElementById("editMode");
    
    // Form navigation tabs
    const personalTab = document.getElementById("personalTab");
    const addressTab = document.getElementById("addressTab");
    const businessTab = document.getElementById("businessTab");
    const paymentsTab = document.getElementById("paymentsTab");
    
    const personalTabContent = document.getElementById("personalTabContent");
    const addressTabContent = document.getElementById("addressTabContent");
    const businessTabContent = document.getElementById("businessTabContent");
    const paymentsTabContent = document.getElementById("paymentsTabContent");
    
    // Buttons
    const editBtn = document.getElementById("editBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const cancelEdit = document.getElementById("cancelEdit");
    const editForm = document.getElementById("editForm");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    
    // Payment management
    const addNewPaymentBtn = document.getElementById("addNewPaymentBtn");
    const newPaymentAmount = document.getElementById("newPaymentAmount");
    const newPaymentDate = document.getElementById("newPaymentDate");
    const newPaymentsList = document.getElementById("newPaymentsList");
    const noNewPaymentsMessage = document.getElementById("no-new-payments-message");
    
    // Handle tab switching
    viewTab.addEventListener("click", () => {
      viewTab.classList.add("tab-active");
      editTab.classList.remove("tab-active");
      viewMode.classList.remove("hidden");
      editMode.classList.add("hidden");
    });
    
    editTab.addEventListener("click", () => {
      viewTab.classList.remove("tab-active");
      editTab.classList.add("tab-active");
      viewMode.classList.add("hidden");
      editMode.classList.remove("hidden");
    });
    
    // Form navigation tabs
    personalTab.addEventListener("click", () => {
      [personalTab, addressTab, businessTab, paymentsTab].forEach(tab => tab.classList.remove("tab-active"));
      personalTab.classList.add("tab-active");
      
      [personalTabContent, addressTabContent, businessTabContent, paymentsTabContent].forEach(content => content.classList.add("hidden"));
      personalTabContent.classList.remove("hidden");
    });
    
    addressTab.addEventListener("click", () => {
      [personalTab, addressTab, businessTab, paymentsTab].forEach(tab => tab.classList.remove("tab-active"));
      addressTab.classList.add("tab-active");
      
      [personalTabContent, addressTabContent, businessTabContent, paymentsTabContent].forEach(content => content.classList.add("hidden"));
      addressTabContent.classList.remove("hidden");
    });
    
    businessTab.addEventListener("click", () => {
      [personalTab, addressTab, businessTab, paymentsTab].forEach(tab => tab.classList.remove("tab-active"));
      businessTab.classList.add("tab-active");
      
      [personalTabContent, addressTabContent, businessTabContent, paymentsTabContent].forEach(content => content.classList.add("hidden"));
      businessTabContent.classList.remove("hidden");
    });
    
    paymentsTab.addEventListener("click", () => {
      [personalTab, addressTab, businessTab, paymentsTab].forEach(tab => tab.classList.remove("tab-active"));
      paymentsTab.classList.add("tab-active");
      
      [personalTabContent, addressTabContent, businessTabContent, paymentsTabContent].forEach(content => content.classList.add("hidden"));
      paymentsTabContent.classList.remove("hidden");
    });

    // Switch to edit mode
    editBtn.addEventListener("click", () => {
      viewTab.classList.remove("tab-active");
      editTab.classList.add("tab-active");
      viewMode.classList.add("hidden");
      editMode.classList.remove("hidden");
    });

    // Cancel editing and return to view mode
    cancelEdit.addEventListener("click", () => {
      if (newPayments.length > 0) {
        if (!confirm("You have unsaved payments. Are you sure you want to cancel?")) {
          return;
        }
      }
      
      viewTab.classList.add("tab-active");
      editTab.classList.remove("tab-active");
      viewMode.classList.remove("hidden");
      editMode.classList.add("hidden");
      
      // Reset new payments
      newPayments = [];
      renderNewPayments();
    });

    // Add new payment in edit mode
    addNewPaymentBtn.addEventListener("click", () => {
      const amt = newPaymentAmount.value.trim();
      const date = newPaymentDate.value.trim();
      
      if (!amt || !date) {
        showToast("Please enter both a payment amount and a payment date.", "error");
        return;
      }
      
      newPayments.push({ amount: Number(amt), date });
      renderNewPayments();
      
      // Clear amount but keep date
      newPaymentAmount.value = "";
      
      // Show success toast
      showToast(`Payment of ${Number(amt).toFixed(2)} added!`, "success");
      
      // Focus back on amount for quick entry
      newPaymentAmount.focus();
    });

    // Render the list of new payments
    function renderNewPayments() {
      if (newPayments.length === 0) {
        noNewPaymentsMessage.classList.remove("hidden");
        newPaymentsList.querySelectorAll(".payment-item").forEach(item => item.remove());
        return;
      }
      
      // Hide no payments message
      noNewPaymentsMessage.classList.add("hidden");
      
      // Clear existing payment items
      newPaymentsList.querySelectorAll(".payment-item").forEach(item => item.remove());
      
      // Add new payment items
      newPayments.forEach((payment, index) => {
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
              <div class="font-medium">${payment.amount.toFixed(2)}</div>
              <div class="text-xs opacity-70">${paymentDate}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm btn-circle" data-index="${index}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        `;
        newPaymentsList.appendChild(paymentItem);
      });

      // Add event listeners to remove buttons
      newPaymentsList.querySelectorAll(".payment-item button").forEach(button => {
        button.addEventListener("click", (e) => {
          const idx = parseInt(e.currentTarget.getAttribute("data-index"));
          
          // Remove with animation
          const itemToRemove = e.currentTarget.closest('.payment-item');
          itemToRemove.classList.add('opacity-0');
          
          setTimeout(() => {
            newPayments.splice(idx, 1);
            renderNewPayments();
          }, 300);
          
          // Show remove toast
          showToast('Payment removed', 'info');
        });
      });
    }

    // Handle delete button
    deleteBtn.addEventListener("click", () => {
      deleteModal.showModal();
    });
    
    // Handle delete confirmation
    confirmDeleteBtn.addEventListener("click", async () => {
      try {
        // Show loading on button
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = `
          <span class="loading loading-spinner loading-xs"></span>
          Deleting...
        `;
        
        await deleteDoc(clientRef);
        showToast("Client deleted successfully!", "success");
        
        // Redirect after a brief delay
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);
      } catch (error) {
        console.error("Error deleting client:", error);
        showToast("Error deleting client: " + error.message, "error");
        
        // Reset button
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Delete";
        
        // Hide modal
        deleteModal.close();
      }
    });

    // Handle edit form submission to update the client record
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Show loading on save button
      const saveBtn = document.getElementById("saveBtn");
      const originalBtnContent = saveBtn.innerHTML;
      saveBtn.disabled = true;
      saveBtn.innerHTML = `
        <span class="loading loading-spinner loading-xs"></span>
        Saving...
      `;
      
      try {
        // Merge existing payments with any newly added ones
        const mergedPayments = [...existingPayments, ...newPayments];
        
        // Get the updated service status
        const newServiceStatus = document.getElementById("editServiceStatus").value;
        
        const updatedClient = {
          personalDetails: {
            name: document.getElementById("editName").value,
            age: document.getElementById("editAge").value,
            gender: document.getElementById("editGender").value,
            contactNumber: document.getElementById("editContact").value,
            businessNumber: document.getElementById("editBusinessNumber").value,
          },
          address: {
            city: document.getElementById("editCity").value,
            district: document.getElementById("editDistrict").value,
            state: document.getElementById("editState").value,
            country: document.getElementById("editCountry").value,
          },
          businessInfo: {
            businessName: document.getElementById("editBusinessName").value,
            businessAddress: document.getElementById("editBusinessAddress").value,
            businessPhone: document.getElementById("editBusinessPhone").value,
            businessWhatsapp: document.getElementById("editBusinessWhatsapp").value,
            serviceType: document.getElementById("editServiceType").value,
            serviceStatus: newServiceStatus,
            paymentMethod: document.getElementById("editPaymentMethod").value,
            // Update payments by merging existing with new
            payments: mergedPayments,
            // Keep the original entry date
            entryDate: new Date().toISOString()
          },
          // Update the top-level status field for filtering
          status: newServiceStatus,
        };

        await updateDoc(clientRef, updatedClient);
        showToast("Client updated successfully!", "success");
        
        // Reload the page after a brief delay to show the changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error("Error updating client:", error);
        showToast("Error updating client: " + error.message, "error");
        
        // Reset button
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnContent;
      }
    });
  }
});
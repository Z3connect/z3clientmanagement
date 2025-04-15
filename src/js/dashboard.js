// src/js/dashboard.js
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Utility function to format currency
function formatCurrency(num) {
  return "$" + Number(num).toFixed(2);
}

document.addEventListener("DOMContentLoaded", async () => {
  const clientTable = document.getElementById("clientTable");
  const activeCountElem = document.getElementById("activeCount");
  const deactiveCountElem = document.getElementById("deactiveCount");
  const pendingCountElem = document.getElementById("pendingCount");
  const totalIncomeElem = document.getElementById("totalIncome");
  const filterInput = document.getElementById("filterInput");
  const statusFilter = document.getElementById("statusFilter");
  const drawerToggle = document.getElementById("drawer-toggle");
  
  // Close drawer when clicking menu items on mobile
  const menuItems = document.querySelectorAll(".drawer-side .menu a");
  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 1024) { // lg breakpoint in Tailwind
        drawerToggle.checked = false;
      }
    });
  });

  let clients = [];

  // Fetch clients data from Firestore
  async function fetchClients() {
    try {
      // Show loading state
      clientTable.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="mt-2">Loading clients...</p>
          </td>
        </tr>
      `;
      
      const querySnapshot = await getDocs(collection(db, "clients"));
      
      if (querySnapshot.empty) {
        clientTable.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-8">
              <p class="text-base-content/70">No clients found. Add your first client!</p>
              <a href="index.html" class="btn btn-sm btn-primary mt-4">Add Client</a>
            </td>
          </tr>
        `;
        return;
      }
      
      clients = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        clients.push(data);
      });
      
      // Apply filters after fetching
      applyFilters();
      
    } catch (error) {
      console.error("Error fetching clients:", error);
      clientTable.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8">
            <div class="alert alert-error shadow-lg max-w-md mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 class="font-bold">Error!</h3>
                <div class="text-sm">Failed to load client data. Please try again later.</div>
              </div>
            </div>
          </td>
        </tr>
      `;
    }
  }

  // Render client data into the table
  function renderClients(data) {
    clientTable.innerHTML = "";
    
    if (data.length === 0) {
      clientTable.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8">
            <p class="text-base-content/70">No clients match your search criteria.</p>
            <button class="btn btn-sm btn-ghost mt-4" onclick="document.getElementById('filterInput').value = ''; document.getElementById('statusFilter').value = 'all'; applyFilters();">Clear Filters</button>
          </td>
        </tr>
      `;
      return;
    }
    
    data.forEach(client => {
      // Determine total payment from the payments array if available
      let totalPayment = 0;
      if (Array.isArray(client.businessInfo?.payments) && client.businessInfo.payments.length > 0) {
        totalPayment = client.businessInfo.payments.reduce(
          (sum, payment) => sum + (Number(payment.amount) || 0),
          0
        );
      } else if (client.businessInfo?.paymentAmount) {
        totalPayment = Number(client.businessInfo.paymentAmount) || 0;
      }
      
      // Get status from either a top-level field or businessInfo field
      const status = client.status || client.businessInfo?.serviceStatus || "N/A";
      const entryDate = client.businessInfo?.entryDate
        ? new Date(client.businessInfo.entryDate).toLocaleDateString()
        : "N/A";
      
      // Create status badge with appropriate color
      let statusBadge = '';
      if (status === "Active") {
        statusBadge = `<span class="badge badge-sm badge-success text-white">${status}</span>`;
      } else if (status === "Pending") {
        statusBadge = `<span class="badge badge-sm badge-warning text-white">${status}</span>`;
      } else if (status === "Deactive") {
        statusBadge = `<span class="badge badge-sm badge-error text-white">${status}</span>`;
      } else {
        statusBadge = `<span class="badge badge-sm">${status}</span>`;
      }
      
      const row = `
        <tr class="hover">
          <td>
            <div class="font-medium">${client.personalDetails?.name || "Unknown"}</div>
          </td>
          <td>
            <div>${client.personalDetails?.contactNumber || "N/A"}</div>
          </td>
          <td class="hidden md:table-cell">
            <div>${client.businessInfo?.businessWhatsapp || "N/A"}</div>
          </td>
          <td>${statusBadge}</td>
          <td class="hidden md:table-cell">${formatCurrency(totalPayment)}</td>
          <td class="hidden md:table-cell">${entryDate}</td>
          <td>
            <div class="dropdown dropdown-end">
              <label tabindex="0" class="btn btn-ghost btn-xs">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
              </label>
              <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-50">
                <li><a href="view-client.html?id=${client.id}" class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>View Details</a></li>
                <li><a href="edit-client.html?id=${client.id}" class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>Edit Client</a></li>
              </ul>
            </div>
          </td>
        </tr>
      `;
      clientTable.insertAdjacentHTML("beforeend", row);
    });
  }

  // Update the dashboard statistics with animations
  function updateStats(data) {
    const activeClients = data.filter(client => {
      const status = client.status || client.businessInfo?.serviceStatus;
      return status === "Active";
    });
    
    const deactiveClients = data.filter(client => {
      const status = client.status || client.businessInfo?.serviceStatus;
      return status === "Deactive";
    });
    
    const pendingClients = data.filter(client => {
      const status = client.status || client.businessInfo?.serviceStatus;
      return status === "Pending";
    });

    const totalIncome = data.reduce((sum, client) => {
      let clientTotal = 0;
      if (Array.isArray(client.businessInfo?.payments) && client.businessInfo.payments.length > 0) {
        clientTotal = client.businessInfo.payments.reduce(
          (s, payment) => s + (Number(payment.amount) || 0),
          0
        );
      } else if (client.businessInfo?.paymentAmount) {
        clientTotal = Number(client.businessInfo.paymentAmount) || 0;
      }
      return sum + clientTotal;
    }, 0);

    // Animate the counters
    animateCounter(activeCountElem, activeClients.length);
    animateCounter(deactiveCountElem, deactiveClients.length);
    animateCounter(pendingCountElem, pendingClients.length);
    animateCounter(totalIncomeElem, formatCurrency(totalIncome), true);
  }

  // Simple counter animation
  function animateCounter(element, target, isCurrency = false) {
    const current = isCurrency 
      ? parseFloat(element.innerText.replace(/[^0-9.-]+/g, '')) || 0
      : parseInt(element.innerText) || 0;
    
    const targetValue = isCurrency 
      ? parseFloat(target.replace(/[^0-9.-]+/g, ''))
      : target;
    
    if (current === targetValue) return;
    
    const duration = 800; // Animation duration in milliseconds
    const frameDuration = 16; // ms per frame (approx 60fps)
    const frames = duration / frameDuration;
    const increment = (targetValue - current) / frames;
    
    let currentValue = current;
    const animate = () => {
      currentValue += increment;
      
      // Check if animation should end
      if ((increment > 0 && currentValue >= targetValue) || 
          (increment < 0 && currentValue <= targetValue)) {
        if (isCurrency) {
          element.innerText = target;
        } else {
          element.innerText = targetValue;
        }
        return;
      }
      
      // Update the element with formatted value
      if (isCurrency) {
        element.innerText = "$" + currentValue.toFixed(2);
      } else {
        element.innerText = Math.round(currentValue);
      }
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  // Apply both text and status filters and update table & stats
  function applyFilters() {
    const textTerm = filterInput.value.toLowerCase();
    const statusTerm = statusFilter.value; // "all" or a specific status

    const filtered = clients.filter(client => {
      const nameMatch = (client.personalDetails?.name || "").toLowerCase().includes(textTerm);
      const status = client.status || client.businessInfo?.serviceStatus || "";
      const statusMatch = statusTerm === "all" ? true : status === statusTerm;
      return nameMatch && statusMatch;
    });
    
    renderClients(filtered);
    updateStats(filtered);
  }

  // Event listeners for filters
  filterInput.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);

  // Mobile responsiveness handlers
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) { // lg breakpoint
      drawerToggle.checked = false;
    }
  });

  // Initial fetch of clients
  fetchClients();
});
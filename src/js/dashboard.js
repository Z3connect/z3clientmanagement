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
  const totalIncomeElem = document.getElementById("totalIncome");
  const filterInput = document.getElementById("filterInput");

  let clients = [];

  // Fetch clients data from Firestore
  async function fetchClients() {
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      clients = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        clients.push(data);
      });
      renderClients(clients);
      updateStats(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }

  // Render client data into the table with proper payment amount handling
  function renderClients(data) {
    clientTable.innerHTML = "";
    data.forEach(client => {
      // Determine total payment:
      let totalPayment = 0;
      
      // If there is a payments array, aggregate its values
      if (Array.isArray(client.businessInfo.payments) && client.businessInfo.payments.length > 0) {
        totalPayment = client.businessInfo.payments.reduce(
          (sum, payment) => sum + (Number(payment.amount) || 0),
          0
        );
      }
      // Alternatively, if a standalone paymentAmount field exists, use that
      else if (client.businessInfo.paymentAmount) {
        totalPayment = Number(client.businessInfo.paymentAmount) || 0;
      } 
      // Otherwise, leave totalPayment as 0

      // Use status from a top-level field or businessInfo.serviceStatus
      const status = client.status || client.businessInfo.serviceStatus || "N/A";

      // Format the entry date if exists
      const entryDate = client.businessInfo.entryDate
        ? new Date(client.businessInfo.entryDate).toLocaleDateString()
        : "";

      const row = `
        <tr>
          <td class="border p-2">${client.personalDetails.name}</td>
          <td class="border p-2">${status}</td>
          <td class="border p-2">${formatCurrency(totalPayment)}</td>
          <td class="border p-2">${entryDate}</td>
          <td class="border p-2">
            <a href="view-client.html?id=${client.id}" class="text-blue-500 underline">View</a>
          </td>
        </tr>
      `;
      clientTable.insertAdjacentHTML("beforeend", row);
    });
  }

  // Update the dashboard statistics: active clients, deactive clients, and total income.
  function updateStats(data) {
    const activeClients = data.filter(client => {
      const status = client.status || client.businessInfo.serviceStatus;
      return status === "Active";
    });
    const deactiveClients = data.filter(client => {
      const status = client.status || client.businessInfo.serviceStatus;
      return status === "Deactive";
    });

    const totalIncome = data.reduce((sum, client) => {
      let clientTotal = 0;
      if (Array.isArray(client.businessInfo.payments) && client.businessInfo.payments.length > 0) {
        clientTotal = client.businessInfo.payments.reduce(
          (s, payment) => s + (Number(payment.amount) || 0),
          0
        );
      } else if (client.businessInfo.paymentAmount) {
        clientTotal = Number(client.businessInfo.paymentAmount) || 0;
      }
      return sum + clientTotal;
    }, 0);

    activeCountElem.innerText = activeClients.length;
    deactiveCountElem.innerText = deactiveClients.length;
    totalIncomeElem.innerText = formatCurrency(totalIncome);
  }

  // Filter clients based on search input
  filterInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = clients.filter(client => {
      const nameMatch = client.personalDetails.name.toLowerCase().includes(term);
      const status = client.status || client.businessInfo.serviceStatus || "";
      const statusMatch = status.toLowerCase().includes(term);
      return nameMatch || statusMatch;
    });
    renderClients(filtered);
    updateStats(filtered);
  });

  // Initial fetch of clients
  fetchClients();
});

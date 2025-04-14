// src/js/view-client.js
import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Utility to get a URL query parameter
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener("DOMContentLoaded", async () => {
  const clientId = getQueryParam("id");
  const clientDetailsDiv = document.getElementById("clientDetails");

  if (!clientId) {
    clientDetailsDiv.innerHTML = "<p>No client ID provided.</p>";
    return;
  }

  const clientRef = doc(db, "clients", clientId);
  let existingPayments = []; // Holds the payments originally saved in Firestore
  let newPayments = []; // Holds any new payment entries added during edit

  try {
    const docSnap = await getDoc(clientRef);
    if (!docSnap.exists()) {
      clientDetailsDiv.innerHTML = "<p>No such client exists.</p>";
      return;
    }
    const client = docSnap.data();
    existingPayments = Array.isArray(client.businessInfo.payments)
      ? client.businessInfo.payments
      : [];
    renderClientDetails(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    clientDetailsDiv.innerHTML = "<p>Error loading client details.</p>";
  }

  // Render the view and edit sections, including Payment History
  function renderClientDetails(client) {
    // Render the Payment History table for existing payments
    const paymentHistoryHTML = existingPayments.length
      ? `<table class="w-full border mt-2">
            <thead>
              <tr class="bg-gray-200">
                <th class="border p-1 text-sm">Amount</th>
                <th class="border p-1 text-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              ${existingPayments
                .map(
                  payment => `<tr>
                    <td class="border p-1 text-sm">$${Number(payment.amount).toFixed(2)}</td>
                    <td class="border p-1 text-sm">${new Date(payment.date).toLocaleDateString()}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
         </table>`
      : "<p>No past payments recorded.</p>";

    clientDetailsDiv.innerHTML = `
      <div id="viewMode">
        <h2 class="text-xl font-semibold">${client.personalDetails.name}</h2>
        <p><strong>Age:</strong> ${client.personalDetails.age}</p>
        <p><strong>Gender:</strong> ${client.personalDetails.gender}</p>
        <p><strong>Contact:</strong> ${client.personalDetails.contactNumber}</p>
        <p><strong>Business Number:</strong> ${client.personalDetails.businessNumber}</p>
        <h3 class="text-lg font-semibold mt-4">Address:</h3>
        <p>${client.address.city}, ${client.address.district}, ${client.address.state}, ${client.address.country}</p>
        <h3 class="text-lg font-semibold mt-4">Business Information:</h3>
        <p><strong>Business Name:</strong> ${client.businessInfo.businessName}</p>
        <p><strong>Business Address:</strong> ${client.businessInfo.businessAddress}</p>
        <p><strong>Business Phone:</strong> ${client.businessInfo.businessPhone}</p>
        <p><strong>Business WhatsApp:</strong> ${client.businessInfo.businessWhatsapp}</p>
        <p><strong>Service Type:</strong> ${client.businessInfo.serviceType}</p>
        <p><strong>Service Status:</strong> ${client.businessInfo.serviceStatus}</p>
        <p><strong>Payment Method:</strong> ${client.businessInfo.paymentMethod}</p>
        <h3 class="text-lg font-semibold mt-4">Payment History</h3>
        ${paymentHistoryHTML}
        <p class="mt-4"><strong>Entry Date:</strong> ${new Date(client.businessInfo.entryDate).toLocaleString()}</p>
        <div class="mt-4">
          <button id="editBtn" class="bg-blue-500 text-white px-4 py-2 rounded mr-2">Edit</button>
          <button id="deleteBtn" class="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
        </div>
      </div>
      <div id="editMode" class="hidden">
        <h2 class="text-xl font-semibold mb-4">Edit Client</h2>
        <form id="editForm" class="space-y-4">
          <!-- Personal Details -->
          <div>
            <label class="block">Name</label>
            <input type="text" id="editName" class="w-full border p-2 rounded" value="${client.personalDetails.name}">
          </div>
          <div>
            <label class="block">Age</label>
            <input type="number" id="editAge" class="w-full border p-2 rounded" value="${client.personalDetails.age}">
          </div>
          <div>
            <label class="block">Gender</label>
            <input type="text" id="editGender" class="w-full border p-2 rounded" value="${client.personalDetails.gender}">
          </div>
          <div>
            <label class="block">Contact</label>
            <input type="tel" id="editContact" class="w-full border p-2 rounded" value="${client.personalDetails.contactNumber}">
          </div>
          <div>
            <label class="block">Business Number</label>
            <input type="text" id="editBusinessNumber" class="w-full border p-2 rounded" value="${client.personalDetails.businessNumber}">
          </div>
          <!-- Address Details -->
          <div>
            <label class="block">City</label>
            <input type="text" id="editCity" class="w-full border p-2 rounded" value="${client.address.city}">
          </div>
          <div>
            <label class="block">District</label>
            <input type="text" id="editDistrict" class="w-full border p-2 rounded" value="${client.address.district}">
          </div>
          <div>
            <label class="block">State</label>
            <input type="text" id="editState" class="w-full border p-2 rounded" value="${client.address.state}">
          </div>
          <div>
            <label class="block">Country</label>
            <input type="text" id="editCountry" class="w-full border p-2 rounded" value="${client.address.country}">
          </div>
          <!-- Business Info -->
          <div>
            <label class="block">Business Name</label>
            <input type="text" id="editBusinessName" class="w-full border p-2 rounded" value="${client.businessInfo.businessName}">
          </div>
          <div>
            <label class="block">Business Address</label>
            <input type="text" id="editBusinessAddress" class="w-full border p-2 rounded" value="${client.businessInfo.businessAddress}">
          </div>
          <div>
            <label class="block">Business Phone</label>
            <input type="tel" id="editBusinessPhone" class="w-full border p-2 rounded" value="${client.businessInfo.businessPhone}">
          </div>
          <div>
            <label class="block">Business WhatsApp</label>
            <input type="tel" id="editBusinessWhatsapp" class="w-full border p-2 rounded" value="${client.businessInfo.businessWhatsapp}">
          </div>
          <div>
            <label class="block">Service Type</label>
            <input type="text" id="editServiceType" class="w-full border p-2 rounded" value="${client.businessInfo.serviceType}">
          </div>
          <div>
            <label class="block">Service Status</label>
            <input type="text" id="editServiceStatus" class="w-full border p-2 rounded" value="${client.businessInfo.serviceStatus}">
          </div>
          <div>
            <label class="block">Payment Method</label>
            <input type="text" id="editPaymentMethod" class="w-full border p-2 rounded" value="${client.businessInfo.paymentMethod}">
          </div>
          <!-- Display existing Payment History (read-only) -->
          <div>
            <h3 class="text-lg font-semibold mt-4">Existing Payment History</h3>
            <div id="existingPaymentsTable">
              ${paymentHistoryHTML}
            </div>
          </div>
          <!-- New Payments Section -->
          <div id="newPaymentsSection" class="mt-6">
            <h3 class="text-lg font-semibold">Add New Payment</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <label for="newPaymentAmount" class="block mb-1">Payment Amount</label>
                <input type="number" id="newPaymentAmount" class="w-full border p-2 rounded" placeholder="0.00">
              </div>
              <div>
                <label for="newPaymentDate" class="block mb-1">Payment Date</label>
                <input type="date" id="newPaymentDate" class="w-full border p-2 rounded">
              </div>
              <div class="flex items-end">
                <button type="button" id="addNewPaymentBtn" class="bg-green-500 text-white px-4 py-2 rounded">Add Payment</button>
              </div>
            </div>
            <div id="newPaymentsList" class="mt-4 space-y-2">
              <!-- Newly added payments will appear here -->
            </div>
          </div>
          <div class="mt-4">
            <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded mr-2">Save</button>
            <button type="button" id="cancelEdit" class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      </div>
    `;
    addEventListeners();
  }

  // Attach event listeners for edit, adding new payments, cancel, save, and delete actions
  function addEventListeners() {
    const editBtn = document.getElementById("editBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const editMode = document.getElementById("editMode");
    const viewMode = document.getElementById("viewMode");
    const cancelEdit = document.getElementById("cancelEdit");
    const editForm = document.getElementById("editForm");
    const addNewPaymentBtn = document.getElementById("addNewPaymentBtn");
    const newPaymentAmount = document.getElementById("newPaymentAmount");
    const newPaymentDate = document.getElementById("newPaymentDate");
    const newPaymentsList = document.getElementById("newPaymentsList");

    // Switch to edit mode
    editBtn.addEventListener("click", () => {
      viewMode.classList.add("hidden");
      editMode.classList.remove("hidden");
    });

    // Cancel editing and return to view mode
    cancelEdit.addEventListener("click", () => {
      editMode.classList.add("hidden");
      viewMode.classList.remove("hidden");
    });

    // Add new payment in edit mode
    addNewPaymentBtn.addEventListener("click", () => {
      const amt = newPaymentAmount.value.trim();
      const date = newPaymentDate.value.trim();
      if (!amt || !date) {
        alert("Please enter both a payment amount and a payment date.");
        return;
      }
      newPayments.push({ amount: Number(amt), date });
      renderNewPayments();
      newPaymentAmount.value = "";
      newPaymentDate.value = "";
    });

    // Render the list of new payments
    function renderNewPayments() {
      newPaymentsList.innerHTML = "";
      newPayments.forEach((payment, index) => {
        const div = document.createElement("div");
        div.classList.add("flex", "items-center", "justify-between", "border", "p-2", "rounded");
        div.innerHTML = `<span>$${Number(payment.amount).toFixed(2)} on ${new Date(payment.date).toLocaleDateString()}</span>
                          <button class="text-red-500" data-index="${index}">Remove</button>`;
        newPaymentsList.appendChild(div);
      });
      newPaymentsList.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", (e) => {
          const idx = e.target.getAttribute("data-index");
          newPayments.splice(idx, 1);
          renderNewPayments();
        });
      });
    }

    // Handle edit form submission to update the client record
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      // Merge existing payments with any newly added ones
      const mergedPayments = existingPayments.concat(newPayments);
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
          serviceStatus: document.getElementById("editServiceStatus").value,
          paymentMethod: document.getElementById("editPaymentMethod").value,
          // Update payments by merging existing with new
          payments: mergedPayments,
          entryDate: new Date().toISOString()
        },
        status: document.getElementById("editServiceStatus").value,
      };

      try {
        await updateDoc(clientRef, updatedClient);
        alert("Client updated successfully.");
        window.location.reload();
      } catch (error) {
        console.error("Error updating client:", error);
        alert("Error updating client.");
      }
    });

    // Handle deletion of the client record
    deleteBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this client?")) {
        try {
          await deleteDoc(clientRef);
          alert("Client deleted successfully.");
          window.location.href = "dashboard.html";
        } catch (error) {
          console.error("Error deleting client:", error);
          alert("Error deleting client.");
        }
      }
    });
  }
});

// src/js/index.js
import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const clientForm = document.getElementById("clientForm");

  // Payment entries array to store multiple payments
  let payments = [];

  // Elements for Payment entries
  const paymentAmountInput = document.getElementById("paymentAmountInput");
  const paymentDateInput = document.getElementById("paymentDateInput");
  const addPaymentBtn = document.getElementById("addPaymentBtn");
  const paymentsList = document.getElementById("paymentsList");

  // Handle "Add Payment" button click
  addPaymentBtn.addEventListener("click", () => {
    const amount = paymentAmountInput.value.trim();
    const date = paymentDateInput.value.trim();

    if (!amount || !date) {
      alert("Please enter both a payment amount and a payment date.");
      return;
    }

    // Create a payment entry and add to the payments array
    const paymentEntry = { amount: Number(amount), date };
    payments.push(paymentEntry);

    // Update the displayed list of payments
    renderPaymentsList();
    // Clear the input fields
    paymentAmountInput.value = "";
    paymentDateInput.value = "";
  });

  // Render the list of added payment entries
  function renderPaymentsList() {
    paymentsList.innerHTML = "";
    payments.forEach((payment, index) => {
      const paymentItem = document.createElement("div");
      paymentItem.classList.add("flex", "items-center", "justify-between", "border", "p-2", "rounded");
      paymentItem.innerHTML = `<span>$${payment.amount.toFixed(2)} on ${new Date(payment.date).toLocaleDateString()}</span>
        <button class="text-red-500" data-index="${index}">Remove</button>`;
      paymentsList.appendChild(paymentItem);
    });

    // Add event listeners to remove buttons
    paymentsList.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", (e) => {
        const idx = e.target.getAttribute("data-index");
        payments.splice(idx, 1);
        renderPaymentsList();
      });
    });
  }

  clientForm.addEventListener("submit", async (e) => {
    e.preventDefault();

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

    try {
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
          // Include the payments array (each payment has an amount and a date)
          payments,
          // Optional: store the first payment details if desired
          // paymentAmount: payments.length ? payments[0].amount : 0,
          // entryDate for business info can be included here as well:
          entryDate
        },
        // Optionally add a top-level status field for filtering purposes
        status: serviceStatus,
        createdAt: entryDate
      });

      alert("Client added successfully with ID: " + docRef.id);
      clientForm.reset();
      payments = [];
      renderPaymentsList();
    } catch (error) {
      console.error("Error adding client: ", error);
      alert("Error adding client. Check console for details.");
    }
  });
});

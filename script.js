$(document).ready(function () {
  const apiGlobal = "https://disease.sh/v3/covid-19/all";
  const apiCountries = "https://disease.sh/v3/covid-19/countries/";
  const apiCountryList = "https://disease.sh/v3/covid-19/countries";

  const ctx = document.getElementById("covidChart").getContext("2d");
  let covidChart;
  let selectedCountry = "";
  let previousCases = null; // আগের কেস সংখ্যা মনে রাখবে

  // ১️⃣ Global Summary লোড ফাংশন
  function loadGlobalSummary() {
    $.get(apiGlobal, function (data) {
      $("#globalCases").text(data.cases.toLocaleString());
      $("#globalRecovered").text(data.recovered.toLocaleString());
      $("#globalDeaths").text(data.deaths.toLocaleString());

      const now = new Date();
      $("#lastUpdated").text("Last updated: " + now.toLocaleTimeString());
    });
  }

  // ২️⃣ Dropdown-এ দেশগুলোর নাম আনো
  $.get(apiCountryList, function (data) {
    data.forEach((country) => {
      $("#countrySelect").append(
        `<option value="${country.country}">${country.country}</option>`
      );
    });
  });

  // ৩️⃣ Search বোতামে ক্লিক করলে দেশের ডেটা আনো
  $("#searchBtn").click(function () {
    selectedCountry = $("#countrySelect").val();
    if (!selectedCountry) {
      showError("Please select a country first!");
      return;
    }
    fetchCountryData(selectedCountry);
  });

  // ৪️⃣ দেশের ডেটা ফেচ করা
  function fetchCountryData(country) {
    $.ajax({
      url: apiCountries + country,
      method: "GET",
      success: function (data) {
        $("#error").addClass("d-none");
        $("#statsCard").removeClass("d-none");

        $("#countryName").text(data.country);
        $("#confirmed").text(data.cases.toLocaleString());
        $("#recovered").text(data.recovered.toLocaleString());
        $("#deaths").text(data.deaths.toLocaleString());

        // Alert চেক করো (যদি আগের রিফ্রেশের সাথে পার্থক্য থাকে)
        if (previousCases !== null) {
          const diff = data.cases - previousCases;
          if (diff > 0) {
            showNotification(
              `⚠️ ${country}-এ নতুন ${diff.toLocaleString()} কেস বৃদ্ধি পেয়েছে!`,
              "danger"
            );
          } else if (diff < 0) {
            showNotification(
              `✅ ${country}-এ ${Math.abs(diff).toLocaleString()} কেস কমেছে!`,
              "success"
            );
          }
        }
        previousCases = data.cases;

        // Chart data
        const chartData = {
          labels: ["Confirmed", "Recovered", "Deaths"],
          datasets: [
            {
              label: "COVID-19 Stats",
              data: [data.cases, data.recovered, data.deaths],
              backgroundColor: ["#ffc107", "#28a745", "#dc3545"]
            }
          ]
        };

        if (covidChart) covidChart.destroy();

        covidChart = new Chart(ctx, {
          type: "bar",
          data: chartData,
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: "COVID-19 Data for " + data.country }
            }
          }
        });
      },
      error: function () {
        showError("Country not found or API error.");
      }
    });
  }

  // ৫️⃣ Error মেসেজ
  function showError(msg) {
    $("#error").text(msg).removeClass("d-none");
    $("#statsCard").addClass("d-none");
  }

  // ৬️⃣ Notification দেখানোর ফাংশন
  function showNotification(message, type = "info") {
    const alertBox = $(`
      <div class="alert alert-${type} alert-dismissible fade show position-fixed bottom-0 end-0 m-3 shadow" role="alert" style="z-index:9999;">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `);
    $("body").append(alertBox);
    setTimeout(() => alertBox.alert("close"), 8000); // ৮ সেকেন্ডে নিজে বন্ধ
  }

  // ৭️⃣ Auto Refresh প্রতি ১ মিনিটে
  loadGlobalSummary();
  setInterval(() => {
    loadGlobalSummary();
    if (selectedCountry) fetchCountryData(selectedCountry);
  }, 60000);
});
document.getElementById("submitBtn").addEventListener("click", () => {
  const filters = {
    sortBy: document.getElementById("sortBy").value,
    datePosted: document.getElementById("datePosted").value,
    videos: document.getElementById("videos").checked,
    images: document.getElementById("images").checked,
    liveVideos: document.getElementById("liveVideos").checked,
    jobPosts: document.getElementById("jobPosts").checked,
    documents: document.getElementById("documents").checked,
    collabArticles: document.getElementById("collabArticles").checked,
    personName: document.getElementById("personName").value,
    firstConnections: document.getElementById("firstConnections").checked,
    me: document.getElementById("me").checked,
    peopleYouFollow: document.getElementById("peopleYouFollow").checked
  };

  console.log("Saving filters:", filters);
  chrome.storage.local.set({ filters }, () => {
    chrome.tabs.create({ url: "https://www.linkedin.com/search/results/content/" });
  });
});

chrome.storage.local.get(["filters"], (data) => {
  const filters = data.filters;
  if (!filters) return;

  console.log("Retrieved filters from storage:", filters);

  window.addEventListener("load", () => {
    console.log("LinkedIn content page loaded, applying filters...");
    setTimeout(() => {
      applyFilters(filters);
    }, 3000); // Give LinkedIn page some time to load
  });
});

function applyFilters(filters) {
  console.log("Applying filters...");

  if (filters.sortBy) {
    console.log("Applying Sort By:", filters.sortBy);
    const sortButton = document.querySelector('button[aria-label*="Sort by"]');
    if (sortButton) {
      sortButton.click();
      setTimeout(() => {
        const sortOptions = Array.from(document.querySelectorAll('span'));
        const option = sortOptions.find(el => el.innerText.toLowerCase().includes(filters.sortBy));
        if (option) option.click();
      }, 1000);
    }
  }

  if (filters.datePosted) {
    console.log("Applying Date Posted:", filters.datePosted);
    const dateButton = document.querySelector('button[aria-label*="Date posted filter"]');
    if (dateButton) {
      dateButton.click();
      setTimeout(() => {
        const dateOptions = Array.from(document.querySelectorAll('span'));
        const dateOption = dateOptions.find(el => el.innerText.toLowerCase().includes(filters.datePosted.replace("-", " ")));
        if (dateOption) dateOption.click();
      }, 1000);
    }
  }

  const contentTypes = [
    { id: 'videos', label: 'Videos' },
    { id: 'images', label: 'Images' },
    { id: 'liveVideos', label: 'Live Videos' },
    { id: 'jobPosts', label: 'Job Posts' },
    { id: 'documents', label: 'Documents' },
    { id: 'collabArticles', label: 'Collaborative Articles' }
  ];

  contentTypes.forEach(type => {
    if (filters[type.id]) {
      console.log(`Enabling content type: ${type.label}`);
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes(type.label));
      if (button) button.click();
    }
  });

  if (filters.personName) {
    console.log("Typing name in 'From Member':", filters.personName);
    const searchInput = document.querySelector('input[placeholder*="Search by member name"]');
    if (searchInput) {
      searchInput.value = filters.personName;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  if (filters.firstConnections || filters.me || filters.peopleYouFollow) {
    console.log("Setting Posted By options:");
    if (filters.firstConnections) console.log(" - 1st Connections");
    if (filters.me) console.log(" - Me");
    if (filters.peopleYouFollow) console.log(" - People You Follow");
    const postedByButton = document.querySelector('button[aria-label*="Posted by filter"]');
    if (postedByButton) {
      postedByButton.click();
      setTimeout(() => {
        if (filters.firstConnections) {
          const option = document.querySelector('span').innerText.includes("1st connections");
          if (option) option.click();
        }
        if (filters.me) {
          const option = document.querySelector('span').innerText.includes("Me");
          if (option) option.click();
        }
        if (filters.peopleYouFollow) {
          const option = document.querySelector('span').innerText.includes("People you follow");
          if (option) option.click();
        }
      }, 1000);
    }
  }

  console.log("All selected filters applied.");
}

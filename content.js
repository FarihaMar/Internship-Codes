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

  // Apply Sort By filter
  if (filters.sortBy) {
    console.log("Applying Sort By:", filters.sortBy);
    const sortButton = document.querySelector('button[aria-label*="Sort by"]');
    if (sortButton) {
      sortButton.click();
      setTimeout(() => {
        const sortOptions = Array.from(document.querySelectorAll('span'));
        const option = sortOptions.find(el => el.innerText.toLowerCase().includes(filters.sortBy));
        if (option) {
          option.click();
          console.log(`Sort By applied: ${filters.sortBy}`);
        }
      }, 1000);
    }
  }

  // Apply Date Posted filter
  if (filters.datePosted) {
    console.log("Applying Date Posted:", filters.datePosted);
    const dateButton = document.querySelector('button[aria-label*="Date posted filter"]');
    if (dateButton) {
      dateButton.click();
      setTimeout(() => {
        const dateOptions = Array.from(document.querySelectorAll('span'));
        const dateOption = dateOptions.find(el => el.innerText.toLowerCase().includes(filters.datePosted.replace("-", " ")));
        if (dateOption) {
          dateOption.click();
          console.log(`Date Posted filter applied: ${filters.datePosted}`);
        }
      }, 1000);
    }
  }

  // Apply Content Type filters
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
      if (button) {
        button.click();
        console.log(`Content type applied: ${type.label}`);
      }
    }
  });

  // Apply "From Member" filter (search for person)
  if (filters.personName) {
    console.log("Typing name in 'From Member':", filters.personName);
    const searchInput = document.querySelector('input[placeholder*="Search by member name"]');
    if (searchInput) {
      searchInput.value = filters.personName;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log(`Typed "${filters.personName}" into "From Member" search`);
    }
  }

  // Apply Posted By filters
  if (filters.firstConnections || filters.me || filters.peopleYouFollow) {
    console.log("Setting Posted By options:");
    const postedByButton = document.querySelector('button[aria-label*="Posted by filter"]');
    if (postedByButton) {
      postedByButton.click();
      setTimeout(() => {
        const options = document.querySelectorAll('span');
        
        if (filters.firstConnections) {
          const firstConnectionOption = Array.from(options).find(el => el.innerText.includes("1st connections"));
          if (firstConnectionOption) {
            firstConnectionOption.click();
            console.log("1st Connections filter applied");
          }
        }

        if (filters.me) {
          const meOption = Array.from(options).find(el => el.innerText.includes("Me"));
          if (meOption) {
            meOption.click();
            console.log("Me filter applied");
          }
        }

        if (filters.peopleYouFollow) {
          const followOption = Array.from(options).find(el => el.innerText.includes("People you follow"));
          if (followOption) {
            followOption.click();
            console.log("People you follow filter applied");
          }
        }

      }, 1000);
    }
  }

  console.log("All selected filters applied.");
}

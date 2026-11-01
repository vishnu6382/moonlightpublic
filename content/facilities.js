// FACILITIES CONTENT
// Real list of 12 facilities in 4 groups from Master Prompt 5.1 item 3 & old site screenshots

export const facilitiesData = {
  title: 'Facilities',
  subtitle: 'Comfort-first stay essentials.',
  image: null,
  groups: [
    {
      id: 'comfort',
      name: 'Comfort',
      items: [
        { name: 'Air conditioning', icon: 'ac', group: 'Comfort' },
        { name: 'Power Backup', icon: 'power', group: 'Comfort' },
        { name: 'Free Wifi', icon: 'wifi', group: 'Comfort' },
      ],
    },
    {
      id: 'food',
      name: 'Food',
      items: [
        { name: 'Breakfast', icon: 'coffee', group: 'Food' },
        { name: 'Dining Area', icon: 'utensils', group: 'Food' },
        { name: 'Fully equipped Kitchen', icon: 'kitchen', group: 'Food' },
      ],
    },
    {
      id: 'space-stay',
      name: 'Space & Stay',
      items: [
        { name: 'Ample Parking', icon: 'parking', group: 'Space & Stay' },
        { name: 'Conference Hall', icon: 'hall', group: 'Space & Stay' },
        { name: 'Family-friendly', icon: 'family', group: 'Space & Stay' },
        { name: 'Luxury Camping', icon: 'tent', group: 'Space & Stay' },
      ],
    },
    {
      id: 'extras',
      name: 'Extras',
      items: [
        { name: 'Local Experiences', icon: 'compass', group: 'Extras' },
        { name: 'Long Stay Discounts', icon: 'discount', group: 'Extras' },
      ],
    },
  ],
};

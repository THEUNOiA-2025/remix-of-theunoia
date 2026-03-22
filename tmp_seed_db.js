import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.argv[2],
  process.argv[3]
)

const top40Colleges = [
  { name: "Indian Institute of Technology Madras", short_name: "IIT Madras", city: "Chennai", state: "Tamil Nadu" },
  { name: "Indian Institute of Science Bangalore", short_name: "IISc Bangalore", city: "Bengaluru", state: "Karnataka" },
  { name: "Indian Institute of Technology Bombay", short_name: "IIT Bombay", city: "Mumbai", state: "Maharashtra" },
  { name: "Indian Institute of Technology Delhi", short_name: "IIT Delhi", city: "New Delhi", state: "Delhi" },
  { name: "Indian Institute of Technology Kanpur", short_name: "IIT Kanpur", city: "Kanpur", state: "Uttar Pradesh" },
  { name: "Indian Institute of Technology Kharagpur", short_name: "IIT Kharagpur", city: "Kharagpur", state: "West Bengal" },
  { name: "Indian Institute of Technology Roorkee", short_name: "IIT Roorkee", city: "Roorkee", state: "Uttarakhand" },
  { name: "Indian Institute of Technology Guwahati", short_name: "IIT Guwahati", city: "Guwahati", state: "Assam" },
  { name: "Jawaharlal Nehru University", short_name: "JNU Delhi", city: "New Delhi", state: "Delhi" },
  { name: "Banaras Hindu University", short_name: "BHU Varanasi", city: "Varanasi", state: "Uttar Pradesh" },
  { name: "Amrita Vishwa Vidyapeetham", short_name: "Amrita", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "Jadavpur University", short_name: "JU", city: "Kolkata", state: "West Bengal" },
  { name: "University of Hyderabad", short_name: "UoH", city: "Hyderabad", state: "Telangana" },
  { name: "University of Calcutta", short_name: "CU", city: "Kolkata", state: "West Bengal" },
  { name: "Manipal Academy of Higher Education", short_name: "MAHE", city: "Manipal", state: "Karnataka" },
  { name: "Savitribai Phule Pune University", short_name: "SPPU", city: "Pune", state: "Maharashtra" },
  { name: "Jamia Millia Islamia", short_name: "JMI", city: "New Delhi", state: "Delhi" },
  { name: "VIT University", short_name: "VIT Vellore", city: "Vellore", state: "Tamil Nadu" },
  { name: "Anna University", short_name: "Anna University", city: "Chennai", state: "Tamil Nadu" },
  { name: "Aligarh Muslim University", short_name: "AMU Aligarh", city: "Aligarh", state: "Uttar Pradesh" },
  { name: "Bharathiar University", short_name: "BU", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "Homi Bhabha National Institute", short_name: "HBNI", city: "Mumbai", state: "Maharashtra" },
  { name: "BITS Pilani", short_name: "BITS Pilani", city: "Pilani", state: "Rajasthan" },
  { name: "University of Kerala", short_name: "UK", city: "Thiruvananthapuram", state: "Kerala" },
  { name: "Osmania University", short_name: "OU", city: "Hyderabad", state: "Telangana" },
  { name: "University of Delhi", short_name: "DU", city: "Delhi", state: "Delhi" },
  { name: "Punjab Agricultural University", short_name: "PAU", city: "Ludhiana", state: "Punjab" },
  { name: "Indian Institute of Technology Indore", short_name: "IIT Indore", city: "Indore", state: "Madhya Pradesh" },
  { name: "Indian Institute of Technology Hyderabad", short_name: "IIT Hyderabad", city: "Sangareddy", state: "Telangana" },
  { name: "Indian Institute of Technology Ropar", short_name: "IIT Ropar", city: "Rupnagar", state: "Punjab" },
  { name: "National Institute of Technology Tiruchirappalli", short_name: "NIT Trichy", city: "Tiruchirappalli", state: "Tamil Nadu" },
  { name: "National Institute of Technology Karnataka", short_name: "NIT Surathkal", city: "Surathkal", state: "Karnataka" },
  { name: "National Institute of Technology Rourkela", short_name: "NIT Rourkela", city: "Rourkela", state: "Odisha" },
  { name: "Panjab University", short_name: "PU", city: "Chandigarh", state: "Chandigarh" },
  { name: "Pondicherry University", short_name: "PU", city: "Puducherry", state: "Puducherry" },
  { name: "SRM Institute of Science and Technology", short_name: "SRM Chennai", city: "Chennai", state: "Tamil Nadu" },
  { name: "Chandigarh University", short_name: "CU", city: "Chandigarh", state: "Chandigarh" },
  { name: "Lovely Professional University", short_name: "LPU", city: "Phagwara", state: "Punjab" },
  { name: "Christ University", short_name: "Christ Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { name: "Symbiosis International University", short_name: "SIU Pune", city: "Pune", state: "Maharashtra" }
];

async function seedColleges() {
  console.log('Inserting', top40Colleges.length, 'colleges...')
  const payload = top40Colleges.map(c => ({
    ...c,
    country: "India",
    is_active: true
  }))
  
  const { data, error } = await supabase
    .from('colleges')
    .insert(payload)

  if (error) {
    console.error('Error seeding colleges:', error)
    process.exit(1)
  }
  
  console.log('Seeded successfully!')
}

seedColleges()

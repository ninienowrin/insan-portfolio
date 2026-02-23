export interface ExperienceEntry {
  id: string;
  role: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  type: "work" | "education";
  current?: boolean;
  description: string[];
  tags: string[];
}

export const experiences: ExperienceEntry[] = [
  {
    id: "ucf-phd",
    role: "Ph.D. in Civil, Environmental & Construction Engineering",
    organization: "University of Central Florida",
    location: "Orlando, FL",
    startDate: "Aug 2024",
    endDate: "Jul 2027 (expected)",
    type: "education",
    current: true,
    description: [
      "Research focus: radar perception, sensor fusion, and deep learning for intelligent transportation systems",
      "Advisor: Dr. Mohamed Abdel-Aty, P.E., F.ASCE, F.ITE, ASEMFL",
    ],
    tags: ["Radar Perception", "Sensor Fusion", "Deep Learning"],
  },
  {
    id: "ucf-ms",
    role: "M.S. in Civil Engineering (Smart Cities Track)",
    organization: "University of Central Florida",
    location: "Orlando, FL",
    startDate: "Aug 2024",
    endDate: "May 2026 (expected)",
    type: "education",
    current: true,
    description: [
      "GPA: 3.75/4.00",
      "Focus on smart cities and intelligent transportation infrastructure",
    ],
    tags: ["Smart Cities", "GPA 3.75"],
  },
  {
    id: "ucf-gra",
    role: "Graduate Research Assistant",
    organization: "University of Central Florida",
    location: "Orlando, FL",
    startDate: "Aug 2024",
    endDate: "Present",
    type: "work",
    current: true,
    description: [
      "Lead researcher on FDOT-funded sensor fusion project: radar-camera BEV detection pipeline",
      "Developing digital twin framework for smart intersection deployment optimization",
      "Processing 4D radar point clouds and multi-modal data synchronization",
    ],
    tags: ["FDOT", "Sensor Fusion", "Digital Twin", "Python"],
  },
  {
    id: "buet-ra",
    role: "Research Assistant",
    organization: "Accident Research Institute, BUET",
    location: "Dhaka, Bangladesh",
    startDate: "Jun 2020",
    endDate: "Jul 2024",
    type: "work",
    description: [
      "Developed IoT-based road safety monitoring system using smartphone sensors",
      "Published research in IEEE IoT Journal and IEEE Transactions on Intelligent Vehicles",
      "Conducted large-scale crash data analysis for transportation safety research",
    ],
    tags: ["IoT", "Road Safety", "Data Analysis", "IEEE"],
  },
  {
    id: "arthor-engineer",
    role: "Embedded Systems Engineer",
    organization: "Arthor Limited",
    location: "Dhaka, Bangladesh",
    startDate: "Jun 2020",
    endDate: "Mar 2023",
    type: "work",
    description: [
      "Designed and deployed embedded systems with UART, SPI, and I2C protocols",
      "Developed firmware for sensor interfacing and real-time data processing",
      "Integrated GPS modules and wireless communication for IoT applications",
    ],
    tags: ["Embedded Systems", "Arduino", "UART/SPI/I2C", "Firmware"],
  },
  {
    id: "iut-bsc",
    role: "B.Sc. in Electrical and Electronic Engineering",
    organization: "Islamic University of Technology",
    location: "Gazipur, Bangladesh",
    startDate: "Jan 2018",
    endDate: "May 2022",
    type: "education",
    description: [
      "GPA: 3.4/4.00",
      "Foundation in signal processing, circuit design, and embedded systems",
    ],
    tags: ["Signal Processing", "Embedded Systems", "GPA 3.4"],
  },
];

export interface EventPhoto {
  src: string;
  alt: string;
}

export interface EventShowcase {
  id: string;
  badge: string;
  badgeClasses: string;
  title: string;
  role: string;
  date: string;
  description: string;
  heroImage: EventPhoto;
  gallery: EventPhoto[];
}

export const events: EventShowcase[] = [
  {
    id: "trb-2026",
    badge: "Research",
    badgeClasses: "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30",
    title: "TRB Annual Meeting 2026",
    role: "Poster Presentation",
    date: "January 2026 — Washington, D.C.",
    description:
      "Presented research on drone-supervised multi-modal sensor fusion for infrastructure-based vehicle detection at the Transportation Research Board Annual Meeting. Discussed practical, deployable solutions for smart intersections with researchers and practitioners from industry and academia.",
    heroImage: {
      src: "/images/poster-presentation/insan_with_poster.jpeg",
      alt: "Insan presenting his research poster at TRB 2026",
    },
    gallery: [
      {
        src: "/images/poster-presentation/insan_with_poster.jpeg",
        alt: "Insan presenting his research poster at TRB 2026",
      },
      {
        src: "/images/poster-presentation/poster.jpeg",
        alt: "Research poster — Drone-Supervised Multi-Modal Sensor Fusion",
      },
      {
        src: "/images/poster-presentation/insan_and_supervisors_w_poster.jpeg",
        alt: "Insan with advisors Dr. Abdel-Aty and Dr. Zubayer Islam",
      },
    ],
  },
  {
    id: "ite-sls-2026",
    badge: "Leadership",
    badgeClasses: "bg-accent-amber/20 text-accent-amber border-accent-amber/30",
    title: "ITE FL-PR Student Leadership Summit 2026",
    role: "Organizer & AMA Moderator",
    date: "February 2026 — Orlando, FL",
    description:
      "Led the organizing effort for the ITE Florida-Puerto Rico District Student Leadership Summit hosted at UCF. Moderated the \"Ask Me Anything\" session with senior transportation engineers Chris Russo and Rosana Correa, connecting students with industry leaders.",
    heroImage: {
      src: "/images/ite-ucf-student-chapter/insan_on_stage.jpeg",
      alt: "Insan moderating the AMA session at ITE SLS 2026",
    },
    gallery: [
      {
        src: "/images/ite-ucf-student-chapter/insan_on_stage.jpeg",
        alt: "Insan moderating the AMA session at ITE SLS 2026",
      },
      {
        src: "/images/ite-ucf-student-chapter/insan_on_stage_speaking.jpeg",
        alt: "Insan speaking at the podium during ITE SLS 2026",
      },
      {
        src: "/images/ite-ucf-student-chapter/insan_w_another_presenter_w_poster.jpeg",
        alt: "Insan with Chris Russo beside the ITE SLS 2026 event banner",
      },
      {
        src: "/images/ite-ucf-student-chapter/insan_w_ite_ucf_members.jpeg",
        alt: "ITE UCF Student Chapter team photo",
      },
      {
        src: "/images/ite-ucf-student-chapter/all_people_group_photo.jpeg",
        alt: "All attendees group photo at ITE SLS 2026 on UCF campus",
      },
      {
        src: "/images/ite-ucf-student-chapter/insan_showing_everyone_around_campus.jpeg",
        alt: "Insan leading a campus tour during ITE SLS 2026",
      },
    ],
  },
];

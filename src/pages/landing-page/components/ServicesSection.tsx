const servicesData = [
  {
    id: 1,
    title: 'Video, Audio & Multimedia',
    skills: ['Video editing', 'Motion graphics', 'Color grading', 'Sound design', 'Short-form content', 'Podcast editing'],
    description: 'From raw footage to polished stories, we craft multimedia experiences that engage and communicate clearly.',
    videoUrl: 'https://cdn.prod.website-files.com/67baec8acda347f8a7b9e834%2F685121aefc21476f2fc2281b_Bags-transcode.mp4',
  },
  {
    id: 2,
    title: 'Writing & Content Creation',
    skills: ['Copywriting', 'SEO writing', 'Scriptwriting', 'Content strategy', 'Editing', 'Ghostwriting'],
    description: 'Thoughtful, purpose-driven writing designed to inform, persuade, and connect with the right audience.',
    videoUrl: '',
  },
  {
    id: 3,
    title: 'Web Development & Programming',
    skills: ['Front-end', 'Full-stack', 'API integration', 'Mobile apps', 'AI / ML', 'Automation'],
    description: 'Robust, scalable digital solutions built with performance, security, and long-term growth in mind.',
    videoUrl: '',
  },

  {
    id: 4,
    title: 'Graphic Design & Visual Arts',
    skills: ['Branding', 'UI / UX', 'Web design', 'Motion graphics', '3D rendering', 'Illustration'],
    description: 'Visual systems and designs that balance creativity, clarity, and strong brand identity.',
    videoUrl: '',
  },

  {
    id: 5,
    title: 'Photography & Cinematic Arts',
    skills: ['Cinematography', 'Product photography', 'Color grading', 'Drone videography', 'Short films', 'Storyboarding'],
    description: 'Cinematic visuals crafted to capture emotion, detail, and narrative depth.',
    videoUrl: '',
  },

];

const ServiceCard = ({ service }: { service: typeof servicesData[0] }) => {
  return (
    <div className={`service-card card-${service.id}`}>
      <div className="file-stack">
        {/* Peek files */}
        {[1, 2, 3, 4].map((index) => (
          <div className="file-peek" key={index}>
            {service.videoUrl && (
              <video autoPlay muted loop playsInline>
                <source src={service.videoUrl} type="video/mp4" />
              </video>
            )}
          </div>
        ))}

        {/* Front card */}
        <div className="card-front">
          <div>
            <h3>{service.title}</h3>
            <div className="skills">
              {service.skills.map((skill, index) => (
                <span className="skill" key={index}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="card-content-right">{service.description}</div>
        </div>
      </div>
    </div>
  );
};

const ServicesSection = () => {
  return (
    <section className="our-services">
      <div className="services-container">
        <div className="services-heading">Our Creations</div>

        <div className="services-list">
          {servicesData.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;

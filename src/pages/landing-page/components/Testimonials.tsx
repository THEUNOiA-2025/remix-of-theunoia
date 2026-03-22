const testimonialsData = [
  // Column 1
  [
    {
      name: 'Arvind R',
      role: 'Founder, EdTech Platform',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arvind',
      rating: 4,
      text: 'Working with THEUNOIA felt surprisingly smooth. The students were motivated, took feedback seriously, and delivered exactly what we needed within the timeline.',
    },
    {
      name: 'Meghana S',
      role: 'Operations Manager',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meghana',
      rating: 5,
      text: 'The process was clear from day one. We could track progress easily and the communication was consistent throughout the project.',
    },
  ],
  // Column 2
  [
    {
      name: 'Rajaram',
      role: 'School Founder',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajaram',
      rating: 4,
      text: 'THEUNOIA made it easy to connect with skilled students for real-world projects. The quality of work and communication exceeded expectations.',
    },
    {
      name: 'Sai Kumar',
      role: 'Managing Director',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SaiKumar',
      rating: 4,
      text: 'A great platform for finding young talent. THEUNOIA helped us complete our project efficiently while supporting student growth.',
    },
  ],
  // Column 3
  [
    {
      name: 'Suresh Kumar',
      role: 'CEO',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
      rating: 5,
      text: 'THEUNOIA perfectly bridges the gap between clients and student professionals. Transparent workflow, quality delivery, and great support.',
    },
    {
      name: 'Karthik V',
      role: 'CTO, Startup',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik',
      rating: 4,
      text: "We initially underestimated student talent, but the results changed our perspective. Clean implementation, logical thinking, and good documentation.",
    },
  ],
  // Column 4
  [
    {
      name: 'Sneha M',
      role: 'Marketing Head',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
      rating: 5,
      text: 'THEUNOIA helped us execute campaign ideas faster without compromising on quality. The fresh perspectives from students actually worked in our favor.',
    },
    {
      name: 'Ramesh Kumar',
      role: 'Business Owner',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh',
      rating: 4,
      text: 'This platform saved us time and hiring effort. The work delivered was practical, usable, and aligned with our actual business needs.',
    },
  ],
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="card-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`star ${star > rating ? 'empty' : ''}`}>
          ★
        </span>
      ))}
    </div>
  );
};

const TestimonialCard = ({
  testimonial,
}: {
  testimonial: (typeof testimonialsData)[0][0];
}) => {
  return (
    <div className="testimonial-card">
      <div className="card-header">
        <img src={testimonial.avatar} className="card-avatar" alt={testimonial.name} />
        <div className="card-author-info">
          <div className="card-author">{testimonial.name}</div>
          <div className="card-role">{testimonial.role}</div>
          <StarRating rating={testimonial.rating} />
        </div>
        <div className="quote-icon">"</div>
      </div>
      <p className="card-text">{testimonial.text}</p>
    </div>
  );
};

const Testimonials = () => {
  return (
    <section className="testimonials-section">
      <div className="section-header">
        <h2>
          <span className="regular">RESULTS,</span>
          <br />
          <span className="bold">That Inspire</span>
        </h2>
      </div>

      <div className="testimonials-container">
        {testimonialsData.map((column, colIndex) => (
          <div
            key={colIndex}
            className={`testimonial-column ${colIndex % 2 === 0 ? 'animate-up' : 'animate-down'}`}
          >
            {column.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;

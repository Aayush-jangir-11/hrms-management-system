import React from "react";
import CalendarPage from "../../components/common/CalendarPage";

const EmployeeCalendar = () => {
  return (
    <CalendarPage
      portalType="employee"
      title="My Work & Schedule Calendar"
      subtitle="Track daily standups, project milestones, leaves, holidays, and 1-on-1 mentorship meetings"
    />
  );
};

export default EmployeeCalendar;

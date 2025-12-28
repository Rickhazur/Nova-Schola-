import { AppLayout } from "@/components/layout/AppLayout";
import { TutorSession } from "@/components/tutor/TutorSession";

const TutorPrimary = () => {
  return (
    <AppLayout>
      <TutorSession variant="primary" />
    </AppLayout>
  );
};

export default TutorPrimary;

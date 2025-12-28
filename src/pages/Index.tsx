import Layout from "@/components/layout/Layout";
import Hero from "@/components/landing/Hero";
import DualExperience from "@/components/landing/DualExperience";
import WhoIsThisFor from "@/components/landing/WhoIsThisFor";
import HowItWorks from "@/components/landing/HowItWorks";
import IcfesHighlight from "@/components/landing/IcfesHighlight";
import KeyModules from "@/components/landing/KeyModules";
import SocialProof from "@/components/landing/SocialProof";
import FinalCTA from "@/components/landing/FinalCTA";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <DualExperience />
      <WhoIsThisFor />
      <HowItWorks />
      <IcfesHighlight />
      <KeyModules />
      <SocialProof />
      <FinalCTA />
    </Layout>
  );
};

export default Index;

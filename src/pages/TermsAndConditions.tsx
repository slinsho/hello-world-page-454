import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none space-y-6">
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
              <p>
                By accessing and using LibHub, you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to these terms, please do not use
                our service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">2. Use of Service</h2>
              <p>
                LibHub provides a platform for property owners and agents to list, browse, and
                connect regarding real estate properties. You agree to use the service only for
                lawful purposes and in accordance with these Terms and Conditions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">3. User Accounts</h2>
              <p>
                When you create an account with us, you must provide accurate, complete, and current
                information. Failure to do so constitutes a breach of the Terms, which may result in
                immediate termination of your account.
              </p>
              <p>
                You are responsible for safeguarding the password and for all activities that occur
                under your account. You agree not to disclose your password to any third party.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">4. Property Listings</h2>
              <p>
                Users who create property listings warrant that all information provided is accurate
                and that they have the legal right to list the property. LibHub reserves the right
                to remove any listing that violates these terms or is deemed inappropriate.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">5. Verification</h2>
              <p>
                To list properties, users must complete our verification process. We reserve the
                right to approve or reject verification requests at our discretion. Verified status
                may be revoked if fraudulent information is discovered.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">6. Prohibited Activities</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the service for any illegal purpose</li>
                <li>Post false, misleading, or fraudulent property listings</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to the service</li>
                <li>Use automated systems to access the service without permission</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">7. Intellectual Property</h2>
              <p>
                The service and its original content, features, and functionality are owned by
                LibHub and are protected by international copyright, trademark, and other
                intellectual property laws.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">8. Limitation of Liability</h2>
              <p>
                LibHub shall not be liable for any indirect, incidental, special, consequential, or
                punitive damages resulting from your use or inability to use the service. We do not
                guarantee the accuracy of property listings or the conduct of users.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. Continued use of
                the service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">10. Contact Information</h2>
              <p>
                If you have any questions about these Terms and Conditions, please contact us
                through the platform.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Row,
  Column,
} from '@react-email/components'
import type { Load, Carrier, Customer } from '@/payload-types'

interface RateConfirmationEmailProps {
  load: Load
  carrier: Carrier
  customer: Customer
  pickupCity: string
  pickupState: string
  deliveryCity: string
  deliveryState: string
  brokerInfo: {
    companyName: string
    phone: string
    email: string
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const equipmentTypeLabels: Record<string, string> = {
  'dry-van': 'Dry Van',
  'reefer': 'Reefer',
  'flatbed': 'Flatbed',
  'step-deck': 'Step Deck',
  'power-only': 'Power Only',
  'hotshot': 'Hotshot',
  'box-truck': 'Box Truck',
}

export const RateConfirmationEmail: React.FC<RateConfirmationEmailProps> = ({
  load,
  carrier,
  pickupCity,
  pickupState,
  deliveryCity,
  deliveryState,
  brokerInfo,
}) => {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>
            Rate Confirmation - Load #{load.loadNumber}
          </Heading>

          <Text style={styles.text}>
            Hello {carrier.primaryContact || carrier.companyName},
          </Text>

          <Text style={styles.text}>
            Please find attached the rate confirmation for the following load.
            Review the details below and sign and return the attached document to confirm.
          </Text>

          <Section style={styles.section}>
            <Heading as="h2" style={styles.subheading}>Load Details</Heading>

            <Row>
              <Column style={styles.column}>
                <Text style={styles.label}>Load Number:</Text>
                <Text style={styles.value}>{load.loadNumber}</Text>
              </Column>
              <Column style={styles.column}>
                <Text style={styles.label}>Equipment:</Text>
                <Text style={styles.value}>
                  {equipmentTypeLabels[load.equipmentType] || load.equipmentType}
                </Text>
              </Column>
            </Row>

            <Hr style={styles.hr} />

            <Row>
              <Column style={styles.column}>
                <Text style={styles.label}>Pickup:</Text>
                <Text style={styles.value}>{pickupCity}, {pickupState}</Text>
                <Text style={styles.value}>{formatDate(load.pickupDate)}</Text>
              </Column>
              <Column style={styles.column}>
                <Text style={styles.label}>Delivery:</Text>
                <Text style={styles.value}>{deliveryCity}, {deliveryState}</Text>
                <Text style={styles.value}>{formatDate(load.deliveryDate)}</Text>
              </Column>
            </Row>

            <Hr style={styles.hr} />

            <Row>
              <Column style={styles.column}>
                <Text style={styles.label}>Rate:</Text>
                <Text style={styles.rateValue}>{formatCurrency(load.carrierRate || 0)}</Text>
              </Column>
              {load.weight && (
                <Column style={styles.column}>
                  <Text style={styles.label}>Weight:</Text>
                  <Text style={styles.value}>{load.weight.toLocaleString()} lbs</Text>
                </Column>
              )}
            </Row>
          </Section>

          <Section style={styles.section}>
            <Heading as="h2" style={styles.subheading}>Next Steps</Heading>
            <Text style={styles.text}>
              1. Review the attached rate confirmation document
            </Text>
            <Text style={styles.text}>
              2. Sign and return the document to confirm acceptance
            </Text>
            <Text style={styles.text}>
              3. Provide driver name and phone number when available
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            If you have any questions, please contact us at {brokerInfo.phone} or reply to this email.
          </Text>

          <Text style={styles.signature}>
            Thank you,
            <br />
            {brokerInfo.companyName}
            <br />
            {brokerInfo.email}
            <br />
            {brokerInfo.phone}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
  },
  heading: {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    margin: '0 0 30px',
  },
  subheading: {
    color: '#1a1a1a',
    fontSize: '18px',
    fontWeight: 'bold' as const,
    margin: '0 0 15px',
  },
  section: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  text: {
    color: '#4a4a4a',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 15px',
  },
  column: {
    width: '50%',
    verticalAlign: 'top' as const,
  },
  label: {
    color: '#666',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    margin: '0 0 4px',
  },
  value: {
    color: '#1a1a1a',
    fontSize: '14px',
    margin: '0 0 10px',
  },
  rateValue: {
    color: '#2563eb',
    fontSize: '20px',
    fontWeight: 'bold' as const,
    margin: '0 0 10px',
  },
  hr: {
    borderColor: '#e6e6e6',
    margin: '15px 0',
  },
  footer: {
    color: '#666',
    fontSize: '12px',
    textAlign: 'center' as const,
    margin: '20px 0',
  },
  signature: {
    color: '#4a4a4a',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '20px 0 0',
  },
}

export default RateConfirmationEmail

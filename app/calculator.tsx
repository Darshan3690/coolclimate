import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { updateUserStats } from '../services/dashboardService';

type StepId = 'transport' | 'energy' | 'food' | 'waste' | 'shopping';

interface CalculatorData {
  carKm: string;
  carType: 'electric' | 'hybrid' | 'average' | 'suv';
  publicTransitKm: string;
  shortFlights: string;
  longFlights: string;
  electricityKwh: string;
  naturalGasTherm: string;
  renewableEnergy: boolean;
  meatKg: string;
  dairyKg: string;
  cottonKg: string;
  silkKg: string;
  polyesterKg: string;
  recycling: 'always' | 'sometimes' | 'rarely';
}

interface Results {
  total: number;
  breakdown: {
    transportation: number;
    homeEnergy: number;
    food: number;
    shopping: number;
    waste: number;
  };
}

interface ValidationIssue {
  field: string;
  message: string;
  severity: 'warning' | 'error';
}

export default function CalculatorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  
  const [formData, setFormData] = useState<CalculatorData>({
    carKm: '0',
    carType: 'average',
    publicTransitKm: '0',
    shortFlights: '0',
    longFlights: '0',
    electricityKwh: '0',
    naturalGasTherm: '0',
    renewableEnergy: false,
    meatKg: '1.5',
    dairyKg: '2',
    cottonKg: '0',
    silkKg: '0',
    polyesterKg: '0',
    recycling: 'sometimes',
  });

  const VALIDATION_RANGES = {
    carKm: { min: 0, max: 1600, average: 400, warning: 800 },
    publicTransitKm: { min: 0, max: 800, average: 80, warning: 480 },
    shortFlights: { min: 0, max: 100, average: 4, warning: 20 },
    longFlights: { min: 0, max: 50, average: 2, warning: 10 },
    electricityKwh: { min: 0, max: 5000, average: 877, warning: 2000 },
    naturalGasTherm: { min: 0, max: 300, average: 40, warning: 150 },
    meatKg: { min: 0, max: 10, average: 1.5, warning: 4 },
    dairyKg: { min: 0, max: 10, average: 2, warning: 5 },
    cottonKg: { min: 0, max: 20, average: 1, warning: 5 },
    silkKg: { min: 0, max: 5, average: 0.1, warning: 1 },
    polyesterKg: { min: 0, max: 25, average: 1.5, warning: 6 },
  };

  const steps = [
    { id: 'transport', title: 'Transportation', icon: 'car-outline', color: '#3b82f6' },
    { id: 'energy', title: 'Home Energy', icon: 'home-outline', color: '#f59e0b' },
    { id: 'food', title: 'Food & Diet', icon: 'restaurant-outline', color: '#ef4444' },
    { id: 'shopping', title: 'Shopping', icon: 'cart-outline', color: '#8b5cf6' },
    { id: 'waste', title: 'Waste', icon: 'trash-outline', color: '#10b981' },
  ];

  const emissionFactors = {
    car: { electric: 0.075, hybrid: 0.155, average: 0.251, suv: 0.336 },
    publicTransit: 0.087,
    shortFlight: 0.255,
    longFlight: 0.195,
    electricity: 0.92,
    electricityRenewable: 0.1,
    naturalGas: 5.3,
    meatKg: 44.07,
    dairyKg: 7.5,
    cottonKg: 2.5,
    silkKg: 15,
    polyesterKg: 7,
    wasteMultiplier: { always: 0.8, sometimes: 1.0, rarely: 1.2 },
  };

  const validateNumericInput = (text: string, field: keyof CalculatorData) => {
    let numericValue = text.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      numericValue = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2 && parts[1].length > 2) {
      numericValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
    updateFormData(field, numericValue);
  };

  const getInputWarning = (field: string, value: string): string => {
    const num = parseFloat(value) || 0;
    const range = VALIDATION_RANGES[field as keyof typeof VALIDATION_RANGES];
    if (!range) return '';
    if (num > range.warning) {
      return `⚠️ This seems unusually high (average: ${range.average})`;
    }
    return '';
  };

  const validateAllInputs = (): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    
    const carKm = parseFloat(formData.carKm) || 0;
    if (carKm > VALIDATION_RANGES.carKm.warning) {
      issues.push({
        field: 'Car Kilometers',
        message: `${carKm} km/week is very high. Average is ${VALIDATION_RANGES.carKm.average} km/week.`,
        severity: 'warning'
      });
    }
    if (carKm > VALIDATION_RANGES.carKm.max) {
      issues.push({
        field: 'Car Kilometers',
        message: `${carKm} km/week exceeds maximum realistic value.`,
        severity: 'error'
      });
    }

    const meatKg = parseFloat(formData.meatKg) || 0;
    if (meatKg > VALIDATION_RANGES.meatKg.warning) {
      issues.push({
        field: 'Meat Consumption',
        message: `${meatKg} kg/week is very high. Average is ${VALIDATION_RANGES.meatKg.average} kg/week.`,
        severity: 'warning'
      });
    }
     if (meatKg > VALIDATION_RANGES.meatKg.max) {
      issues.push({
        field: 'Meat Consumption',
        message: `${meatKg} kg/week exceeds maximum realistic value.`,
        severity: 'error'
      });
    }

    const dairyKg = parseFloat(formData.dairyKg) || 0;
    if (dairyKg > VALIDATION_RANGES.dairyKg.warning) {
      issues.push({
        field: 'Dairy Consumption',
        message: `${dairyKg} kg/week is very high. Average is ${VALIDATION_RANGES.dairyKg.average} kg/week.`,
        severity: 'warning'
      });
    }
     if (dairyKg > VALIDATION_RANGES.dairyKg.max) {
      issues.push({
        field: 'Dairy Consumption',
        message: `${dairyKg} kg/week exceeds maximum realistic value.`,
        severity: 'error'
      });
    }

    const cottonKg = parseFloat(formData.cottonKg) || 0;
    if (cottonKg > VALIDATION_RANGES.cottonKg.warning) {
      issues.push({
        field: 'Cotton Consumption',
        message: `${cottonKg} kg/month is very high. Average is ${VALIDATION_RANGES.cottonKg.average} kg/month.`,
        severity: 'warning'
      });
    }
    if (cottonKg > VALIDATION_RANGES.cottonKg.max) {
      issues.push({
        field: 'Cotton Consumption',
        message: `${cottonKg} kg/month exceeds maximum realistic value.`,
        severity: 'error'
      });
    }

    const silkKg = parseFloat(formData.silkKg) || 0;
    if (silkKg > VALIDATION_RANGES.silkKg.warning) {
      issues.push({
        field: 'Silk Consumption',
        message: `${silkKg} kg/month is very high. Average is ${VALIDATION_RANGES.silkKg.average} kg/month.`,
        severity: 'warning'
      });
    }
    if (silkKg > VALIDATION_RANGES.silkKg.max) {
      issues.push({
        field: 'Silk Consumption',
        message: `${silkKg} kg/month exceeds maximum realistic value.`,
        severity: 'error'
      });
    }

    const polyesterKg = parseFloat(formData.polyesterKg) || 0;
    if (polyesterKg > VALIDATION_RANGES.polyesterKg.warning) {
      issues.push({
        field: 'Polyester Consumption',
        message: `${polyesterKg} kg/month is very high. Average is ${VALIDATION_RANGES.polyesterKg.average} kg/month.`,
        severity: 'warning'
      });
    }
    if (polyesterKg > VALIDATION_RANGES.polyesterKg.max) {
      issues.push({
        field: 'Polyester Consumption',
        message: `${polyesterKg} kg/month exceeds maximum realistic value.`,
        severity: 'error'
      });
    }


    return issues;
  };

  const calculateFootprint = () => {
    const carEmissions = parseFloat(formData.carKm || '0') * 52 * emissionFactors.car[formData.carType] / 1000;
    const transitEmissions = parseFloat(formData.publicTransitKm || '0') * 52 * emissionFactors.publicTransit / 1000;
    const shortFlightEmissions = parseFloat(formData.shortFlights || '0') * 1100 * emissionFactors.shortFlight / 1000;
    const longFlightEmissions = parseFloat(formData.longFlights || '0') * 4400 * emissionFactors.longFlight / 1000;
    const transportation = carEmissions + transitEmissions + shortFlightEmissions + longFlightEmissions;

    const electricityFactor = formData.renewableEnergy ? emissionFactors.electricityRenewable : emissionFactors.electricity;
    const homeEnergy = (parseFloat(formData.electricityKwh || '0') * 12 * electricityFactor / 1000) + 
                       (parseFloat(formData.naturalGasTherm || '0') * 12 * emissionFactors.naturalGas / 1000);

    const food = ((parseFloat(formData.meatKg || '0') * 52 * emissionFactors.meatKg) + 
                  (parseFloat(formData.dairyKg || '0') * 52 * emissionFactors.dairyKg)) / 1000;

    const shopping = ((parseFloat(formData.cottonKg || '0') * 12 * emissionFactors.cottonKg) +
                      (parseFloat(formData.silkKg || '0') * 12 * emissionFactors.silkKg) +
                      (parseFloat(formData.polyesterKg || '0') * 12 * emissionFactors.polyesterKg)) / 1000;

    const waste = 0.5 * emissionFactors.wasteMultiplier[formData.recycling];

    const total = transportation + homeEnergy + food + shopping + waste;
    
    const calculatedResults = {
      total: parseFloat(total.toFixed(2)),
      breakdown: {
        transportation: parseFloat(transportation.toFixed(2)),
        homeEnergy: parseFloat(homeEnergy.toFixed(2)),
        food: parseFloat(food.toFixed(2)),
        shopping: parseFloat(shopping.toFixed(2)),
        waste: parseFloat(waste.toFixed(2)),
      }
    };

    setResults(calculatedResults);
    return calculatedResults;
  };

  const saveToFirebase = async (calculatedResults: Results) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save data');
      return;
    }

    setSaving(true);
    try {
      // 1. Save calculation history
      await addDoc(collection(db, 'carbon_calculations'), {
        userId: user.uid,
        userEmail: user.email,
        date: serverTimestamp(),
        todayDate: new Date().toISOString().split('T')[0],
        inputs: {
          transportation: {
            carKm: parseFloat(formData.carKm || '0'),
            carType: formData.carType,
            publicTransitKm: parseFloat(formData.publicTransitKm || '0'),
            shortFlights: parseFloat(formData.shortFlights || '0'),
            longFlights: parseFloat(formData.longFlights || '0'),
          },
          energy: {
            electricityKwh: parseFloat(formData.electricityKwh || '0'),
            naturalGasTherm: parseFloat(formData.naturalGasTherm || '0'),
            renewableEnergy: formData.renewableEnergy,
          },
          food: {
            meatKg: parseFloat(formData.meatKg || '0'),
            dairyKg: parseFloat(formData.dairyKg || '0'),
          },
          shopping: {
            cottonKg: parseFloat(formData.cottonKg || '0'),
            silkKg: parseFloat(formData.silkKg || '0'),
            polyesterKg: parseFloat(formData.polyesterKg || '0'),
          },
          waste: {
            recycling: formData.recycling,
          },
        },
        results: {
          totalCO2: calculatedResults.total,
          breakdown: calculatedResults.breakdown,
        },
        calculatedAt: new Date().toISOString(),
      });

      // 2. Update user dashboard stats
      const breakdown = calculatedResults.breakdown;
      let actionType = 'transport';
      let maxValue = breakdown.transportation;
      
      if (breakdown.homeEnergy > maxValue) {
        actionType = 'energy';
        maxValue = breakdown.homeEnergy;
      }
      if (breakdown.food > maxValue) {
        actionType = 'food';
      }
      if (breakdown.shopping > maxValue) {
        actionType = 'waste';
      }

      // Calculate carbon saved vs average (16,000 kg/year average footprint)
      const averageFootprint = 16000;
      const carbonSavedTotal = Math.max(0, averageFootprint - calculatedResults.total);
      const carbonSavedWeekly = carbonSavedTotal / 52;

      // Update user stats
      const updateResult = await updateUserStats(
        user.uid,
        parseFloat(carbonSavedWeekly.toFixed(2)),
        actionType,
        'Calculated carbon footprint'
      );

      console.log('Stats updated:', updateResult);

      Alert.alert(
        'Success! 🎉',
        `Your carbon footprint: ${calculatedResults.total} kg CO₂/year\n\nWeekly carbon saved: ${carbonSavedWeekly.toFixed(2)} kg\nCoins earned: ${updateResult.coinsEarned}\nLevel: ${updateResult.newLevel}`,
        [
          { text: 'View Dashboard', onPress: () => router.push('/dashboard' as unknown as any) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof CalculatorData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const issues = validateAllInputs();
      const errors = issues.filter(i => i.severity === 'error');
      
      if (errors.length > 0) {
        setValidationIssues(issues);
        setShowValidationModal(true);
      } else if (issues.length > 0) {
        setValidationIssues(issues);
        setShowValidationModal(true);
      } else {
        calculateFootprint();
        setShowResults(true);
      }
    }
  };

  const proceedWithCalculation = () => {
    setShowValidationModal(false);
    calculateFootprint();
    setShowResults(true);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const useAverage = (field: keyof typeof VALIDATION_RANGES) => {
    const average = VALIDATION_RANGES[field].average;
    updateFormData(field as keyof CalculatorData, average.toString());
  };

  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / steps.length) * 100;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {steps.length}
        </Text>
      </View>
    );
  };

  const renderInputWithValidation = (
    label: string,
    field: keyof CalculatorData,
    hint?: string,
    showAverage?: boolean
  ) => {
    const warning = getInputWarning(field, formData[field] as string);
    const range = VALIDATION_RANGES[field as keyof typeof VALIDATION_RANGES];
    
    return (
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>{label}</Text>
          {showAverage && range && (
            <TouchableOpacity onPress={() => useAverage(field as keyof typeof VALIDATION_RANGES)}>
              <Text style={styles.averageLink}>Use average ({range.average})</Text>
            </TouchableOpacity>
          )}
        </View>
        {hint && <Text style={styles.inputHint}>{hint}</Text>}
        <TextInput
          style={[styles.input, warning && styles.inputWarning]}
          value={formData[field] as string}
          onChangeText={(text) => validateNumericInput(text, field)}
          keyboardType="numeric"
          placeholderTextColor="#6b7280"
          placeholder="0"
        />
        {warning && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning-outline" size={16} color="#f59e0b" />
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderTransportStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
          <Ionicons name="car-outline" size={32} color="#3b82f6" />
        </View>
        <Text style={styles.stepTitle}>Transportation</Text>
        <Text style={styles.stepSubtitle}>How do you get around daily?</Text>
      </View>

      {renderInputWithValidation('Weekly car kilometers', 'carKm', undefined, true)}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Vehicle type</Text>
        <View style={styles.optionGrid}>
          {[
            { value: 'electric', label: 'Electric', icon: 'flash' },
            { value: 'hybrid', label: 'Hybrid', icon: 'leaf' },
            { value: 'average', label: 'Gas Car', icon: 'car' },
            { value: 'suv', label: 'SUV/Truck', icon: 'car-sport' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                formData.carType === option.value && styles.optionCardActive
              ]}
              onPress={() => updateFormData('carType', option.value)}
            >
              <Ionicons 
                name={option.icon as any} 
                size={24} 
                color={formData.carType === option.value ? '#10b981' : '#9ca3af'} 
              />
              <Text style={[
                styles.optionText,
                formData.carType === option.value && styles.optionTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {renderInputWithValidation('Weekly public transit kilometers', 'publicTransitKm', undefined, true)}
      {renderInputWithValidation('Short flights per year (under 3 hrs)', 'shortFlights', undefined, true)}
      {renderInputWithValidation('Long flights per year (over 3 hrs)', 'longFlights', undefined, true)}
    </ScrollView>
  );

  const renderEnergyStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
          <Ionicons name="home-outline" size={32} color="#f59e0b" />
        </View>
        <Text style={styles.stepTitle}>Home Energy</Text>
        <Text style={styles.stepSubtitle}>Your household energy usage</Text>
      </View>

      {renderInputWithValidation('Monthly electricity (kWh)', 'electricityKwh', 'Check your electricity bill', true)}
      {renderInputWithValidation('Monthly natural gas (therms)', 'naturalGasTherm', 'Check your gas bill', true)}

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => updateFormData('renewableEnergy', !formData.renewableEnergy)}
      >
        <View style={[styles.checkbox, formData.renewableEnergy && styles.checkboxChecked]}>
          {formData.renewableEnergy && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <View style={styles.checkboxLabel}>
          <Text style={styles.checkboxText}>I use renewable energy</Text>
          <Text style={styles.checkboxSubtext}>Solar, wind, or green energy plan</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderFoodStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
          <Ionicons name="restaurant-outline" size={32} color="#ef4444" />
        </View>
        <Text style={styles.stepTitle}>Food & Diet</Text>
        <Text style={styles.stepSubtitle}>Your weekly eating habits</Text>
      </View>

      {renderInputWithValidation('Meat consumption per week (kg)', 'meatKg', 'Beef, pork, chicken, fish', true)}
      {renderInputWithValidation('Dairy consumption per week (kg)', 'dairyKg', 'Milk, cheese, yogurt', true)}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#10b981" />
        <Text style={styles.infoText}>
          Plant-based diets have 50-75% lower carbon footprint than meat-heavy diets
        </Text>
      </View>
    </ScrollView>
  );

  const renderShoppingStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <Ionicons name="cart-outline" size={32} color="#8b5cf6" />
        </View>
        <Text style={styles.stepTitle}>Shopping</Text>
        <Text style={styles.stepSubtitle}>Monthly textile purchasing habits</Text>
      </View>

      {renderInputWithValidation('Monthly cotton purchased (kg)', 'cottonKg', undefined, true)}
      {renderInputWithValidation('Monthly silk purchased (kg)', 'silkKg', undefined, true)}
      {renderInputWithValidation('Monthly polyester purchased (kg)', 'polyesterKg', undefined, true)}
    </ScrollView>
  );

  const renderWasteStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
          <Ionicons name="trash-outline" size={32} color="#10b981" />
        </View>
        <Text style={styles.stepTitle}>Waste Management</Text>
        <Text style={styles.stepSubtitle}>Your recycling habits</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>How often do you recycle?</Text>
        <View style={styles.optionList}>
          {[
            { value: 'always', label: 'Always', icon: 'checkmark-circle' },
            { value: 'sometimes', label: 'Sometimes', icon: 'ellipse-outline' },
            { value: 'rarely', label: 'Rarely', icon: 'close-circle' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionListItem,
                formData.recycling === option.value && styles.optionListItemActive
              ]}
              onPress={() => updateFormData('recycling', option.value)}
            >
              <Ionicons 
                name={option.icon as any} 
                size={24} 
                color={formData.recycling === option.value ? '#10b981' : '#9ca3af'} 
              />
              <Text style={[
                styles.optionListText,
                formData.recycling === option.value && styles.optionListTextActive
              ]}>
                {option.label}
              </Text>
              {formData.recycling === option.value && (
                <Ionicons name="checkmark" size={24} color="#10b981" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="leaf" size={24} color="#10b981" />
        <Text style={styles.infoText}>
          Recycling and composting can reduce household waste by up to 75%
        </Text>
      </View>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderTransportStep();
      case 1: return renderEnergyStep();
      case 2: return renderFoodStep();
      case 3: return renderShoppingStep();
      case 4: return renderWasteStep();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/landing' as unknown as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carbon Calculator</Text>
        <View style={styles.placeholder} />
      </View>

      {renderProgressBar()}

      <View style={styles.mainContent}>
        {renderCurrentStep()}
      </View>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={prevStep}
          >
            <Ionicons name="arrow-back" size={20} color="#10b981" />
            <Text style={styles.secondaryButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.primaryButton, currentStep === 0 && styles.primaryButtonFull]}
          onPress={nextStep}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? 'Saving...' : currentStep === steps.length - 1 ? 'Calculate' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Validation Modal */}
      <Modal visible={showValidationModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons 
                name={validationIssues.some(i => i.severity === 'error') ? "alert-circle" : "warning"} 
                size={48} 
                color={validationIssues.some(i => i.severity === 'error') ? "#ef4444" : "#f59e0b"} 
              />
              <Text style={styles.modalTitle}>
                {validationIssues.some(i => i.severity === 'error') 
                  ? 'Please Review Your Inputs' 
                  : 'Unusual Values Detected'}
              </Text>
            </View>

            <ScrollView style={styles.issuesList}>
              {validationIssues.map((issue, index) => (
                <View key={index} style={[
                  styles.issueItem,
                  issue.severity === 'error' ? styles.issueError : styles.issueWarning
                ]}>
                  <Ionicons 
                    name={issue.severity === 'error' ? "close-circle" : "warning"} 
                    size={20} 
                    color={issue.severity === 'error' ? "#ef4444" : "#f59e0b"} 
                  />
                  <View style={styles.issueContent}>
                    <Text style={styles.issueField}>{issue.field}</Text>
                    <Text style={styles.issueMessage}>{issue.message}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => setShowValidationModal(false)}
              >
                <Text style={styles.editButtonText}>Edit Inputs</Text>
              </TouchableOpacity>
              
              {!validationIssues.some(i => i.severity === 'error') && (
                <TouchableOpacity 
                  style={styles.continueButton} 
                  onPress={proceedWithCalculation}
                >
                  <Text style={styles.continueButtonText}>Continue Anyway</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal visible={showResults} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.resultsHeader}>
                <Ionicons name="analytics" size={48} color="#10b981" />
                <Text style={styles.modalTitle}>Your Carbon Footprint</Text>
              </View>
            
              {results && (
                <View style={styles.resultsContainer}>
                  <View style={styles.totalResult}>
                    <Text style={styles.totalLabel}>Annual Total</Text>
                    <Text style={styles.totalValue}>{results.total}</Text>
                    <Text style={styles.totalUnit}>kg CO₂eq/year</Text>
                  </View>

                  <View style={styles.breakdownContainer}>
                    <Text style={styles.breakdownTitle}>Breakdown by Category</Text>
                    
                    {[
                      { key: 'transportation', label: 'Transportation', icon: 'car', color: '#3b82f6' },
                      { key: 'homeEnergy', label: 'Home Energy', icon: 'home', color: '#f59e0b' },
                      { key: 'food', label: 'Food & Diet', icon: 'restaurant', color: '#ef4444' },
                      { key: 'shopping', label: 'Shopping', icon: 'cart', color: '#8b5cf6' },
                      { key: 'waste', label: 'Waste', icon: 'trash', color: '#10b981' },
                    ].map((category) => {
                      const value = results.breakdown[category.key as keyof typeof results.breakdown];
                      const percentage = results.total > 0 ? (value / results.total * 100).toFixed(1) : "0.0";
                      
                      return (
                        <View key={category.key} style={styles.breakdownItem}>
                          <View style={styles.breakdownHeader}>
                            <View style={styles.breakdownLeft}>
                              <View style={[styles.breakdownIcon, { backgroundColor: category.color }]}>
                                <Ionicons name={category.icon as any} size={20} color="#fff" />
                              </View>
                              <Text style={styles.breakdownLabel}>{category.label}</Text>
                            </View>
                            <Text style={styles.breakdownValue}>{Math.round(value)} kg</Text>
                          </View>
                          <View style={styles.breakdownBar}>
                            <View style={[styles.breakdownBarFill, { width: `${percentage}%` as any, backgroundColor: category.color }]} />
                          </View>
                          <Text style={styles.breakdownPercentage}>{percentage}% of annual total</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.comparisonCard}>
                    <Ionicons name="people" size={24} color="#10b981" />
                    <Text style={styles.comparisonText}>
                      {results.total < 4000 
                        ? '🎉 Below average! You\'re doing great!'
                        : results.total < 8000
                        ? '👍 Close to average carbon footprint'
                        : '⚠️ Above average - room for improvement'}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.resultsActions}>
                <TouchableOpacity 
                  style={styles.backToCalcButton} 
                  onPress={() => setShowResults(false)}
                >
                  <Ionicons name="arrow-back" size={20} color="#9ca3af" />
                  <Text style={styles.backToCalcButtonText}>Back to Calculator</Text>
                </TouchableOpacity>

                <View style={styles.mainActions}>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={() => { 
                      if (results) { 
                        saveToFirebase(results); 
                        setShowResults(false); 
                      } 
                    }}
                    disabled={saving}
                  >
                    <Ionicons name="save-outline" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>
                      {saving ? 'Saving...' : 'Save Results'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.homeButton} 
                    onPress={() => {
                      setShowResults(false);
                      router.push('/landing' as unknown as any);
                    }}
                  >
                    <Ionicons name="home" size={20} color="#fff" />
                    <Text style={styles.homeButtonText}>Back to Home</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.returnToDashboardButton} 
                  onPress={() => {
                    setShowResults(false);
                    router.push('/dashboard' as unknown as any);
                  }}
                >
                  <Ionicons name="apps" size={24} color="#fff" />
                  <Text style={styles.returnToDashboardButtonText}>View Dashboard</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#374151'
  },
  backButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  placeholder: { width: 40 },
  
  progressContainer: { padding: 16 },
  progressBar: { 
    height: 8, 
    backgroundColor: '#374151', 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#10b981', 
    borderRadius: 4 
  },
  progressText: { 
    color: '#9ca3af', 
    fontSize: 12, 
    marginTop: 8, 
    textAlign: 'center' 
  },

  mainContent: { flex: 1 },
  stepContent: { flex: 1, padding: 20 },
  stepHeader: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 16
  },
  stepTitle: { 
    color: '#fff', 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  stepSubtitle: { 
    color: '#9ca3af', 
    fontSize: 16, 
    textAlign: 'center' 
  },

  inputGroup: { marginBottom: 24 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  inputLabel: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600'
  },
  averageLink: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600'
  },
  inputHint: { 
    color: '#6b7280', 
    fontSize: 12, 
    marginBottom: 8 
  },
  input: { 
    backgroundColor: '#1f2937', 
    borderWidth: 1, 
    borderColor: '#374151', 
    borderRadius: 12, 
    padding: 16, 
    color: '#fff', 
    fontSize: 16 
  },
  inputWarning: {
    borderColor: '#f59e0b',
    borderWidth: 2
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 8
  },
  warningText: {
    flex: 1,
    color: '#f59e0b',
    fontSize: 12,
    lineHeight: 16
  },

  optionGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12 
  },
  optionCard: { 
    flex: 1, 
    minWidth: '45%', 
    backgroundColor: '#1f2937', 
    borderWidth: 2, 
    borderColor: '#374151', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    gap: 8 
  },
  optionCardActive: { 
    borderColor: '#10b981', 
    backgroundColor: 'rgba(16, 185, 129, 0.1)' 
  },
  optionText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  optionTextActive: { color: '#10b981' },

  optionList: { gap: 12 },
  optionListItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: '#1f2937', 
    borderWidth: 2, 
    borderColor: '#374151', 
    borderRadius: 12, 
    padding: 16 
  },
  optionListItemActive: { 
    borderColor: '#10b981', 
    backgroundColor: 'rgba(16, 185, 129, 0.1)' 
  },
  optionListText: { 
    flex: 1, 
    color: '#9ca3af', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  optionListTextActive: { color: '#10b981' },

  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: 16, 
    backgroundColor: '#1f2937', 
    borderRadius: 12 
  },
  checkbox: { 
    width: 28, 
    height: 28, 
    borderWidth: 2, 
    borderColor: '#374151', 
    borderRadius: 6, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkboxChecked: { 
    backgroundColor: '#10b981', 
    borderColor: '#10b981' 
  },
  checkboxLabel: { flex: 1 },
  checkboxText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  checkboxSubtext: { 
    color: '#6b7280', 
    fontSize: 12, 
    marginTop: 4 
  },

  infoCard: { 
    flexDirection: 'row', 
    gap: 12, 
    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
    borderWidth: 1, 
    borderColor: '#10b981', 
    borderRadius: 12, 
    padding: 16, 
    marginTop: 16 
  },
  infoText: { 
    flex: 1, 
    color: '#10b981', 
    fontSize: 14, 
    lineHeight: 20 
  },

  footer: { 
    flexDirection: 'row', 
    gap: 12, 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#374151' 
  },
  secondaryButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#1f2937', 
    borderWidth: 2, 
    borderColor: '#10b981', 
    borderRadius: 12, 
    padding: 16 
  },
  secondaryButtonText: { 
    color: '#10b981', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  primaryButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#10b981', 
    borderRadius: 12, 
    padding: 16 
  },
  primaryButtonFull: { flex: 2 },
  primaryButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  modalContent: { 
    width: '100%', 
    maxHeight: '80%',
    backgroundColor: '#1f2937', 
    borderRadius: 20, 
    padding: 24,
    borderWidth: 1,
    borderColor: '#374151'
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginTop: 12,
    textAlign: 'center'
  },

  issuesList: {
    maxHeight: 300,
    marginBottom: 20
  },
  issueItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  issueError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444'
  },
  issueWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#f59e0b'
  },
  issueContent: {
    flex: 1
  },
  issueField: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  issueMessage: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20
  },

  resultsHeader: {
    alignItems: 'center',
    marginBottom: 24
  },
  resultsContainer: {
    gap: 20
  },
  totalResult: {
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10b981'
  },
  totalLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8
  },
  totalValue: {
    color: '#10b981',
    fontSize: 48,
    fontWeight: 'bold'
  },
  totalUnit: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4
  },
  breakdownContainer: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 16
  },
  breakdownTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  breakdownItem: {
    marginBottom: 16
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  breakdownLabel: {
    color: '#d1d5db',
    fontSize: 14
  },
  breakdownValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  breakdownBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4
  },
  breakdownBarFill: {
    height: '100%'
  },
  breakdownPercentage: {
    color: '#9ca3af',
    fontSize: 12
  },
  comparisonCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16
  },
  comparisonText: {
    flex: 1,
    color: '#10b981',
    fontSize: 14,
    lineHeight: 20
  },

  modalButtons: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 20 
  },
  editButton: { 
    flex: 1,
    backgroundColor: '#374151', 
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center'
  },
  editButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center'
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },

  resultsActions: {
    gap: 12,
    marginTop: 20
  },
  backToCalcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151'
  },
  backToCalcButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600'
  },
  mainActions: {
    flexDirection: 'row',
    gap: 12
  },
  saveButton: { 
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981', 
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12
  },
  saveButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12
  },
  homeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  returnToDashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#10b981',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
  },
  returnToDashboardButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
    textAlign: 'center'
  },
});


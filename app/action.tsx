import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Emission factors (kg CO2eq per unit)
const EMISSION_FACTORS = {
  // Per km
  walk: 0.0,
  bicycle: 0.0,
  eBikeScooter: 0.05,
  busMetro: 0.10,
  train: 0.04,
  car: 0.21,
  motorbike: 0.09,
  flight: 0.25,
  // Per kWh
  electricity: 0.45,
};

// Appliance power consumption in kW (kilowatts)
const APPLIANCE_FACTORS = {
  ac: 1.5,
  fan: 0.075,
  refrigerator: 0.05, // Assumes average power draw over 24h
};

// Food emission factors (kg CO2eq per kg of food)
const FOOD_EMISSION_FACTORS: { [key: string]: number } = {
    beef: 26.0,
    chicken: 4.4,
    rice: 2.5,
    wheat: 0.8,
};

type Category = 'transportation' | 'homeAppliances' | 'ateSustainably';

interface ModeOption {
  key: string;
  label: string;
  icon: string;
  image: string;
}

interface CategoryItem {
  id: Category;
  title: string;
  icon: string;
  color: string;
  description: string;
  fields: {
    key: string;
    label: string;
    placeholder?: string;
    unit?: string;
    type?: 'mode' | 'comparison' | 'input';
    modes?: ModeOption[];
  }[];
}

interface CalculatorData {
  [key: string]: { [field: string]: string };
}

const TRANSPORT_MODES: ModeOption[] = [
  { key: 'walk', label: 'Walk', icon: 'walk', image: '🚶' },
  { key: 'bicycle', label: 'Bicycle', icon: 'bicycle', image: '🚲' },
  { key: 'eBikeScooter', label: 'E-Bike/Scooter', icon: 'sparkles', image: '🛴' },
  { key: 'busMetro', label: 'Bus/Metro', icon: 'bus', image: '🚌' },
  { key: 'train', label: 'Train', icon: 'train', image: '🚆' },
  { key: 'car', label: 'Car', icon: 'car', image: '🚗' },
  { key: 'motorbike', label: 'Motorbike', icon: 'rocket', image: '🏍️' },
  { key: 'flight', label: 'Flight', icon: 'airplane', image: '✈️' },
];

const APPLIANCE_MODES: ModeOption[] = [
    { key: 'ac', label: 'AC', icon: 'snow', image: '❄️' },
    { key: 'fan', label: 'Fan', icon: 'leaf', image: '🍃' },
    { key: 'refrigerator', label: 'Fridge', icon: 'cube', image: '🧊' },
];

interface ModeCardProps {
  label: string;
  image: string;
  isSelected: boolean;
  onPress: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ label, image, isSelected, onPress }) => (
  <TouchableOpacity style={[styles.modeCard, isSelected && styles.modeCardSelected]} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.modeImageContainer}>
      <View style={[styles.modeImageWrapper, { backgroundColor: isSelected ? '#374151' : '#111827' }]}>
        <Text style={styles.modeImagePlaceholder}>{image}</Text>
      </View>
      {isSelected && (
        <View style={styles.modeCheckmark}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </View>
      )}
    </View>
    <Text style={styles.modeLabel}>{label}</Text>
  </TouchableOpacity>
);

// --- Reusable Usage Input Component ---
interface UsageInputProps {
    label: string;
    unit: string;
    value: string;
    onUpdate: (value: string) => void;
    step?: number;
}

const UsageInput: React.FC<UsageInputProps> = ({ label, unit, value, onUpdate, step = 1 }) => {
    const handleValueChange = (change: number) => {
        const currentValue = parseFloat(value || '0');
        const newValue = Math.max(0, currentValue + change);
        // Handle floating point inaccuracies
        onUpdate(String(parseFloat(newValue.toFixed(2))));
    };
    return (
        <View style={styles.distanceGroup}>
            <Text style={styles.distanceLabel}>{label}</Text>
            <View style={styles.distanceControlContainer}>
                <TouchableOpacity style={styles.distanceButton} onPress={() => handleValueChange(-step)}>
                    <Text style={styles.distanceButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.distanceInputWrapper}>
                    <TextInput style={styles.distanceInput} keyboardType="numeric" value={value} onChangeText={onUpdate} maxLength={5} />
                    <Text style={styles.distanceUnit}>{unit}</Text>
                </View>
                <TouchableOpacity style={styles.distanceButton} onPress={() => handleValueChange(step)}>
                    <Text style={styles.distanceButtonText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Home Appliances Step Component ---
const HomeAppliancesStep: React.FC<{ category: CategoryItem; data: CalculatorData; updateField: (category: Category, field: string, value: string) => void; dailyEmissions: number; }> = ({ category, data, updateField, dailyEmissions }) => {
    const applianceData = data[category.id] || {};

    const toggleAppliance = (key: string) => {
        const currentValue = parseFloat(applianceData[key] || '0');
        // Toggle On/Off. If off, set to a default value. If on, set to 0.
        let newValue = '0';
        if (currentValue === 0) {
            if (key === 'refrigerator') newValue = '24'; // Fridge runs 24h
            else if (key === 'ac') newValue = '8';
            else if (key === 'fan') newValue = '10';
        }
        updateField(category.id, key, newValue);
    };

    return (
        <>
        <View style={styles.savingsDisplay}>
            <Text style={styles.savingsText}>Your Daily Emissions from Appliances</Text>
            <Text style={styles.savingsValue}>
                {dailyEmissions.toFixed(2)} kg
            </Text>
            <Text style={styles.savingsSubtext}>
                (This will be annualized in your final results)
            </Text>
        </View>
        <View style={styles.stepCard}>
            <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon as any} size={32} color="#fff" />
            </View>
            <Text style={styles.stepTitle}>{category.title}</Text>
            <Text style={styles.stepDescription}>{category.description}</Text>

            <View style={styles.modeSection}>
                <Text style={styles.modeSectionTitle}>Select Appliances</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {APPLIANCE_MODES.map(mode => (
                        <ModeCard
                            key={mode.key}
                            label={mode.label}
                            image={mode.image}
                            isSelected={parseFloat(applianceData[mode.key] || '0') > 0}
                            onPress={() => toggleAppliance(mode.key)}
                        />
                    ))}
                </ScrollView>
            </View>

            {APPLIANCE_MODES.map(mode => {
                if (parseFloat(applianceData[mode.key] || '0') > 0) {
                    return (
                        <UsageInput
                            key={mode.key}
                            label={`${mode.label} Daily Usage`}
                            unit="hours/day"
                            value={applianceData[mode.key]}
                            onUpdate={value => updateField(category.id, mode.key, value.replace(/[^0-9.]/g, ''))}
                        />
                    );
                }
                return null;
            })}
        </View>
        </>
    );
};

// --- Food Consumption Step Component ---
const FoodStep: React.FC<{ category: CategoryItem; data: CalculatorData; updateField: (category: Category, field: string, value: string) => void; weeklyEmissions: number; }> = ({ category, data, updateField, weeklyEmissions }) => {
    const foodData = data[category.id] || {};
    return (
        <>
            <View style={styles.savingsDisplay}>
                <Text style={styles.savingsText}>Your Weekly Food Emissions</Text>
                <Text style={styles.savingsValue}>
                    {weeklyEmissions.toFixed(2)} kg
                </Text>
                <Text style={styles.savingsSubtext}>
                    (This will be annualized in your final results)
                </Text>
            </View>
            <View style={styles.stepCard}>
                <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon as any} size={32} color="#fff" />
                </View>
                <Text style={styles.stepTitle}>{category.title}</Text>
                <Text style={styles.stepDescription}>{category.description}</Text>
                {category.fields.map(field => (
                    <UsageInput
                        key={field.key}
                        label={field.label}
                        unit={field.unit || 'kg/week'}
                        value={foodData[field.key] || '0'}
                        onUpdate={value => updateField(category.id, field.key, value.replace(/[^0-9.]/g, ''))}
                        step={0.5}
                    />
                ))}
            </View>
        </>
    );
};


interface TransportationStepProps {
  category: CategoryItem;
  data: CalculatorData;
  updateField: (category: Category, field: string, value: string) => void;
  oneTimeSavings: number;
}

const TransportationStep: React.FC<TransportationStepProps> = ({ category, data, updateField, oneTimeSavings }) => {
  const travelModeField = category.fields.find(f => f.type === 'mode');
  const comparisonModeField = category.fields.find(f => f.type === 'comparison');
  const distanceField = category.fields.find(f => f.key === 'distance');

  const selectedTravelMode = (data[category.id]?.travelMode as keyof typeof EMISSION_FACTORS) || TRANSPORT_MODES[0].key;
  const selectedComparisonMode = (data[category.id]?.comparisonMode as keyof typeof EMISSION_FACTORS) || TRANSPORT_MODES[5].key;
  const distance = data[category.id]?.distance || '0';

  const updateTravelMode = (mode: string) => updateField(category.id, 'travelMode', mode);
  const updateComparisonMode = (mode: string) => updateField(category.id, 'comparisonMode', mode);
  const updateDistance = (value: string) => updateField(category.id, 'distance', value.replace(/[^0-9.]/g, ''));

  const renderModeSection = (title: string, modes: ModeOption[], selectedMode: string, updateMode: (mode: string) => void) => (
    <View style={styles.modeSection}>
      <Text style={styles.modeSectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {modes.map(mode => (
          <ModeCard key={mode.key} label={mode.label} image={mode.image} isSelected={selectedMode === mode.key} onPress={() => updateMode(mode.key)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.stepCard}>
      <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
        <Ionicons name={category.icon as any} size={32} color="#fff" />
      </View>
      <Text style={styles.stepTitle}>{category.title}</Text>
      <Text style={styles.stepDescription}>{category.description}</Text>
      {travelModeField && renderModeSection('I travelled by', TRANSPORT_MODES, selectedTravelMode, updateTravelMode)}
        <UsageInput
            label={distanceField?.label || 'Distance'}
            unit={distanceField?.unit || 'km'}
            value={distance}
            onUpdate={updateDistance}
        />
      {comparisonModeField && renderModeSection('Instead of', TRANSPORT_MODES, selectedComparisonMode, updateComparisonMode)}
      {oneTimeSavings < 0 && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning-outline" size={22} color="#fca5a5" />
          <Text style={styles.warningText}>This action increases emissions compared to your alternative. It is not a sustainable choice.</Text>
        </View>
      )}
    </View>
  );
};

export default function CalculatorScreen() {
  const router = useRouter();
  const [showCategoryList, setShowCategoryList] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['transportation']);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [data, setData] = useState<CalculatorData>({
    transportation: { travelMode: 'bicycle', comparisonMode: 'car', distance: '50' },
    homeAppliances: { ac: '8', fan: '8', refrigerator: '24' },
    ateSustainably: { beef: '0.5', chicken: '1', rice: '1', wheat: '2'},
  });

  const categories: CategoryItem[] = [
    {
      id: 'transportation', title: 'Transportation', icon: 'car', color: '#3b82f6',
      description: 'Log a trip using lower emission vehicles to track your savings.',
      fields: [
        { key: 'travelMode', label: 'Travelled By', type: 'mode', modes: TRANSPORT_MODES },
        { key: 'distance', label: 'Distance', placeholder: '50', unit: 'km' },
        { key: 'comparisonMode', label: 'Instead of', type: 'comparison', modes: TRANSPORT_MODES },
      ],
    },
    {
        id: 'homeAppliances', title: 'Home Appliances', icon: 'home', color: '#f59e0b',
        description: 'Select appliances and enter their daily usage to estimate energy consumption.',
        fields: [
            { key: 'appliances', label: 'Select Appliances', type: 'mode', modes: APPLIANCE_MODES },
        ],
    },
    {
      id: 'ateSustainably', title: 'Food Consumption', icon: 'restaurant', color: '#10b981',
      description: 'Log your weekly food consumption to estimate its carbon impact.',
      fields: [
        { key: 'beef', label: 'Beef Consumption', placeholder: '0', unit: 'kg/week' },
        { key: 'chicken', label: 'Chicken Consumption', placeholder: '0', unit: 'kg/week' },
        { key: 'rice', label: 'Rice Consumption', placeholder: '0', unit: 'kg/week' },
        { key: 'wheat', label: 'Wheat Consumption', placeholder: '0', unit: 'kg/week' },
      ],
    },
  ];

  const getCategory = (id: Category) => categories.find(c => c.id === id);

  const toggleCategory = (categoryId: Category) => {
    setSelectedCategories(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  };

  const startCalculation = () => {
    if (selectedCategories.length === 0) return;
    setShowCategoryList(false);
    setCurrentCategoryIndex(0);
  };

  const handleNext = () => {
    if (currentCategoryIndex < selectedCategories.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    } else if (!showCategoryList) {
      setShowCategoryList(true);
    } else {
      // Navigate back to landing page
      router.push('/landing' as unknown as any);
    }
  };

  const updateField = (category: Category, field: string, value: string) => {
    setData(prev => ({ ...prev, [category]: { ...prev[category], [field]: value } }));
  };

  const calculateCarbonFootprint = () => {
    let totalEmissions = 0;
    let breakdown: any = {};
    let weeklyFoodEmissions = 0;
    let dailyApplianceEmissions = 0;

    selectedCategories.forEach(catId => {
      let categoryTotal = 0;
      if (catId === 'transportation') {
        const transportData = data.transportation;
        const distance = parseFloat(transportData?.distance || '0');
        const travelModeKey = transportData?.travelMode as keyof typeof EMISSION_FACTORS;
        if (distance > 0 && EMISSION_FACTORS[travelModeKey] !== undefined) {
          categoryTotal = distance * EMISSION_FACTORS[travelModeKey];
        }
      } else if (catId === 'homeAppliances') {
        const applianceData = data.homeAppliances;
        Object.keys(applianceData).forEach(applianceKey => {
            const usageHours = parseFloat(applianceData[applianceKey] || '0');
            const powerKw = (APPLIANCE_FACTORS as any)[applianceKey];
            if (usageHours > 0 && powerKw) {
                const dailyKwh = powerKw * usageHours;
                const yearlyEmission = dailyKwh * 365 * EMISSION_FACTORS.electricity;
                categoryTotal += yearlyEmission;
            }
        });
      } else if (catId === 'ateSustainably') {
        const foodData = data.ateSustainably || {};
        Object.keys(foodData).forEach(foodKey => {
            const kgPerWeek = parseFloat(foodData[foodKey] || '0');
            const factor = FOOD_EMISSION_FACTORS[foodKey];
            if (kgPerWeek > 0 && factor) {
                // Annual emission
                categoryTotal += kgPerWeek * factor * 52;
            }
        });
      }
      breakdown[catId] = categoryTotal;
      totalEmissions += categoryTotal;
    });

    // Calculate live food emissions
    if (selectedCategories.includes('ateSustainably')) {
        const foodData = data.ateSustainably || {};
        Object.keys(foodData).forEach(foodKey => {
            const kgPerWeek = parseFloat(foodData[foodKey] || '0');
            const factor = FOOD_EMISSION_FACTORS[foodKey];
            if (kgPerWeek > 0 && factor) {
                weeklyFoodEmissions += kgPerWeek * factor;
            }
        });
    }

    // Calculate live appliance emissions
    if (selectedCategories.includes('homeAppliances')) {
        const applianceData = data.homeAppliances || {};
        Object.keys(applianceData).forEach(applianceKey => {
            const usageHours = parseFloat(applianceData[applianceKey] || '0');
            const powerKw = (APPLIANCE_FACTORS as any)[applianceKey];
            if (usageHours > 0 && powerKw) {
                const dailyKwh = powerKw * usageHours;
                dailyApplianceEmissions += dailyKwh * EMISSION_FACTORS.electricity;
            }
        });
    }

    const transportData = data.transportation;
    const distance = parseFloat(transportData?.distance || '0');
    const travelModeKey = transportData?.travelMode as keyof typeof EMISSION_FACTORS;
    const comparisonModeKey = transportData?.comparisonMode as keyof typeof EMISSION_FACTORS;
    
    let oneTimeSavings = 0;
    if (selectedCategories.includes('transportation') && distance > 0 && EMISSION_FACTORS[travelModeKey] !== undefined && EMISSION_FACTORS[comparisonModeKey] !== undefined) {
      const travelFactor = EMISSION_FACTORS[travelModeKey];
      const comparisonFactor = EMISSION_FACTORS[comparisonModeKey];
      oneTimeSavings = distance * (comparisonFactor - travelFactor);
    }
    
    return {
      total: Math.round(totalEmissions),
      breakdown,
      oneTimeSavings: parseFloat(oneTimeSavings.toFixed(2)),
      weeklyFoodEmissions: parseFloat(weeklyFoodEmissions.toFixed(2)),
      dailyApplianceEmissions: parseFloat(dailyApplianceEmissions.toFixed(2)),
    };
  };

  if (showCategoryList) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#111827", "#1f2937"]} style={styles.header}>
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
                <Text style={styles.headerTitle}>Carbon Calculator</Text>
                <View style={styles.placeholder} />
            </View>
        </LinearGradient>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.introCard}>
                <Text style={styles.introTitle}>Choose Your Categories</Text>
                <Text style={styles.introDescription}>Select the areas where you want to calculate your carbon footprint</Text>
                <View style={styles.selectedCount}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.selectedCountText}>{selectedCategories.length} selected</Text>
                </View>
            </View>
            <View style={styles.categoriesList}>
                {categories.map(category => {
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                        <TouchableOpacity key={category.id} style={[styles.categoryCard, isSelected && styles.categoryCardSelected]} onPress={() => toggleCategory(category.id)} activeOpacity={0.7}>
                            <View style={styles.categoryLeft}>
                                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}><Ionicons name={category.icon as any} size={28} color="#fff" /></View>
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryTitle}>{category.title}</Text>
                                    <Text style={styles.categoryDescription}>{category.description}</Text>
                                </View>
                            </View>
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>{isSelected && <Ionicons name="checkmark" size={20} color="#fff" />}</View>
                        </TouchableOpacity>
                    );
                })}
            </View>
            {selectedCategories.length > 0 && (
                <TouchableOpacity style={styles.startButton} onPress={startCalculation}>
                    <Text style={styles.startButtonText}>Start Calculation</Text>
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </ScrollView>
      </View>
    );
  }

  const currentCategory = getCategory(selectedCategories[currentCategoryIndex]);
  if (!currentCategory) return null;

  const progress = ((currentCategoryIndex + 1) / selectedCategories.length) * 100;
  const results = calculateCarbonFootprint();

  const renderCurrentStep = () => {
    switch (currentCategory.id) {
        case 'transportation':
            return <TransportationStep category={currentCategory} data={data} updateField={updateField} oneTimeSavings={results.oneTimeSavings} />;
        case 'homeAppliances':
            return <HomeAppliancesStep category={currentCategory} data={data} updateField={updateField} dailyEmissions={results.dailyApplianceEmissions} />;
        case 'ateSustainably':
            return <FoodStep category={currentCategory} data={data} updateField={updateField} weeklyEmissions={results.weeklyFoodEmissions} />;
        default:
            return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#111827", "#1f2937"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>{currentCategory.title}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
        <Text style={styles.stepCounter}>Step {currentCategoryIndex + 1} of {selectedCategories.length}</Text>
      </LinearGradient>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentCategory.id === 'transportation' && (
          <View style={styles.savingsDisplay}>
            <Text style={styles.savingsText}>CO₂ Saved on This Trip</Text>
            <Text style={[styles.savingsValue, results.oneTimeSavings < 0 && styles.savingsValueNegative]}>
              {results.oneTimeSavings.toFixed(2)} kg
            </Text>
            <Text style={styles.savingsSubtext}>
              (Based on {data.transportation?.distance || 0} km, compared to <Text style={{ fontWeight: 'bold' }}>{TRANSPORT_MODES.find(m => m.key === data.transportation?.comparisonMode)?.label || 'Car'}</Text>)
            </Text>
          </View>
        )}
        {renderCurrentStep()}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}><Text style={styles.backBtnText}>{currentCategoryIndex === 0 ? 'Categories' : 'Previous'}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}><Text style={styles.nextButtonText}>{currentCategoryIndex === selectedCategories.length - 1 ? 'Calculate' : 'Next'}</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></TouchableOpacity>
        </View>
      </ScrollView>
      <Modal visible={showResults} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Your Carbon Footprint</Text>
                        <TouchableOpacity onPress={() => setShowResults(false)}><Ionicons name="close" size={28} color="#9ca3af" /></TouchableOpacity>
                    </View>
                    <LinearGradient colors={["#10b981", "#059669"]} style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Total Emissions*</Text>
                        <Text style={styles.resultValue}>{results.total}</Text>
                        <Text style={styles.resultUnit}>kg CO₂eq/year</Text>
                        {selectedCategories.includes('transportation') && (
                            <>
                                <Text style={styles.resultLabelSmall}>{results.oneTimeSavings >= 0 ? 'Single Trip Savings:' : 'Single Trip Emission Increase:'}</Text>
                                <Text style={[styles.resultValueSmall, results.oneTimeSavings < 0 && { color: '#fca5a5' }]}>{Math.abs(results.oneTimeSavings).toFixed(2)} kg CO₂eq</Text>
                            </>
                        )}
                    </LinearGradient>
                    <Text style={styles.breakdownTitle}>Emission Breakdown</Text>
                    {Object.entries(results.breakdown).map(([categoryId, value]: [string, any]) => {
                        const category = getCategory(categoryId as Category);
                        if (!category) return null;
                        const percentage = results.total > 0 ? ((value / results.total) * 100).toFixed(1) : '0.0';
                        return (
                            <View key={categoryId} style={styles.breakdownItem}>
                                <View style={styles.breakdownHeader}>
                                    <View style={styles.breakdownLeft}><View style={[styles.breakdownIcon, { backgroundColor: category.color }]}><Ionicons name={category.icon as any} size={20} color="#fff" /></View><Text style={styles.breakdownLabel}>{category.title}</Text></View>
                                    <Text style={styles.breakdownValue}>{Math.round(value)} kg</Text>
                                </View>
                                <View style={styles.breakdownBar}><View style={[styles.breakdownBarFill, { width: `${percentage}%` as any, backgroundColor: category.color }]} /></View>
                                <Text style={styles.breakdownPercentage}>{categoryId === 'transportation' ? 'From this single trip' : `${percentage}% of annual total`}</Text>
                            </View>
                        );
                    })}
                    <Text style={styles.disclaimerText}>*Total includes annual habits (food, home) plus any one-time activities (transportation) logged.</Text>
                </ScrollView>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  placeholder: { width: 40 },
  progressBar: { height: 4, backgroundColor: '#374151', borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#10b981' },
  stepCounter: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  introCard: { backgroundColor: '#1f2937', borderRadius: 24, padding: 24, marginBottom: 24 },
  introTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  introDescription: { color: '#9ca3af', fontSize: 16, lineHeight: 24, marginBottom: 16 },
  selectedCount: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111827', padding: 12, borderRadius: 12 },
  selectedCountText: { color: '#10b981', fontSize: 16, fontWeight: '600' },
  categoriesList: { gap: 12, marginBottom: 24 },
  categoryCard: { backgroundColor: '#1f2937', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  categoryCardSelected: { borderColor: '#10b981' },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  categoryIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  categoryInfo: { flex: 1 },
  categoryTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  categoryDescription: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: '#10b981', borderColor: '#10b981' },
  startButton: { backgroundColor: '#10b981', padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  stepCard: { backgroundColor: '#1f2937', borderRadius: 24, padding: 24, marginBottom: 24, gap: 16 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  stepTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  stepDescription: { color: '#9ca3af', fontSize: 14, marginTop: -8 },
  fieldsContainer: { gap: 20 },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: '#d1d5db', fontSize: 16, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#374151' },
  input: { flex: 1, color: '#fff', fontSize: 16, padding: 16 },
  unitLabel: { color: '#6b7280', fontSize: 14, paddingRight: 16, fontWeight: '600' },
  buttonContainer: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  backBtn: { flex: 1, backgroundColor: '#374151', padding: 16, borderRadius: 12, alignItems: 'center' },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  nextButton: { flex: 1, backgroundColor: '#10b981', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  resultCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24 },
  resultLabel: { color: '#fff', fontSize: 16, opacity: 0.9, marginBottom: 4 },
  resultValue: { color: '#fff', fontSize: 56, fontWeight: 'bold' },
  resultUnit: { color: '#fff', fontSize: 16, opacity: 0.9, marginBottom: 12 },
  resultLabelSmall: { color: '#fff', fontSize: 14, opacity: 0.9, marginTop: 12 },
  resultValueSmall: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  breakdownTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  breakdownItem: { backgroundColor: '#1f2937', borderRadius: 16, padding: 16, marginBottom: 12 },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  breakdownLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  breakdownValue: { color: '#10b981', fontSize: 16, fontWeight: 'bold' },
  breakdownBar: { height: 8, backgroundColor: '#374151', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  breakdownBarFill: { height: '100%' },
  breakdownPercentage: { color: '#9ca3af', fontSize: 12 },
  disclaimerText: { color: '#9ca3af', fontSize: 12, marginTop: 4, marginLeft: 4, marginBottom: 16 },
  savingsDisplay: { backgroundColor: '#1f2937', borderRadius: 16, padding: 20, marginBottom: 24, alignItems: 'center' },
  savingsText: { color: '#9ca3af', fontSize: 16, marginBottom: 4 },
  savingsValue: { color: '#10b981', fontSize: 32, fontWeight: 'bold' },
  savingsValueNegative: { color: '#ef4444' },
  savingsSubtext: { color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingHorizontal: 10 },
  modeSection: { marginBottom: 12 },
  modeSectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modeCard: { width: width / 4.5, aspectRatio: 1, backgroundColor: '#1f2937', borderRadius: 12, marginRight: 8, padding: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  modeCardSelected: { borderColor: '#f59e0b' },
  modeImageContainer: { position: 'relative', marginBottom: 4 },
  modeImageWrapper: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  modeImagePlaceholder: { fontSize: 24 },
  modeCheckmark: { position: 'absolute', top: -5, right: -5, backgroundColor: '#f59e0b', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  modeLabel: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  distanceGroup: { alignItems: 'center', paddingVertical: 12, backgroundColor: '#111827', borderRadius: 16, paddingHorizontal: 16, marginVertical: 8 },
  distanceLabel: { color: '#9ca3af', fontSize: 16, marginBottom: 10 },
  distanceControlContainer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  distanceButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  distanceButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  distanceInputWrapper: { flexDirection: 'row', alignItems: 'flex-end' },
  distanceInput: { color: '#fff', fontSize: 40, fontWeight: 'bold', textAlign: 'center', minWidth: 80, padding: 0, borderBottomWidth: 2, borderColor: '#374151' },
  distanceUnit: { color: '#9ca3af', fontSize: 16, marginLeft: 8, paddingBottom: 8 },
  warningContainer: { marginTop: 16, padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  warningText: { color: '#fca5a5', fontSize: 14, flex: 1, lineHeight: 20 },
});




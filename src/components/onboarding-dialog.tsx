"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRef, useState, useEffect, useCallback } from "react";
import { updateUserSettings } from "@/app/actions";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ASCII_LOGO = `    ____       _       __  ____                     __
   / __ \\_____(_)___  / /_/ __/___ __________ ___  / /
  / /_/ / ___/ / __ \\/ __/ /_/ __ \`/ __ / __ \`__ \\/ / 
 / ____/ /  / / / / / /_/ __/ /_/ / /  / / / / / /_/  
/_/   /_/  /_/_/ /_/\\__/_/  \\__,_/_/  /_/ /_/ /_(_)   
                                                       
`;

const PRINTER_BRANDS = [
  "Prusa",
  "Creality",
  "Voron",
  "Bambu Lab",
  "Other",
] as const;

interface StepProps {
  onNext: (
    data?:
      | "printer"
      | "requestor"
      | { printerBrand: string; buildVolume: string }
  ) => void;
  onBack?: () => void;
  loading?: boolean;
}

const CommandInput = ({
  onKeyDown,
  value,
  onChange,
}: {
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (wrapperRef.current) {
      const length = value?.length || 0;
      wrapperRef.current.style.setProperty("--cursor-position", `${length}ch`);
    }
  }, [value]);

  return (
    <div ref={wrapperRef} className="flex items-center terminal-input-wrapper">
      <span className="text-gray-400 mr-2">$</span>
      <div className="relative flex-1">
        <input
          ref={inputRef}
          autoFocus
          className="w-full font-mono bg-transparent text-green-400 border-none outline-none focus:outline-none focus:ring-0 p-0 terminal-input"
          value={value || ""}
          onChange={onChange}
          onKeyDown={onKeyDown}
          spellCheck={false}
        />
      </div>
    </div>
  );
};

const WelcomeStep = ({ onNext }: StepProps) => {
  const [inputValue, setInputValue] = useState("");
  return (
    <>
      <pre className="text-[0.5rem] leading-[0.6rem] xs:text-xs text-primary font-mono sm:text-sm whitespace-pre sm:mb-4">
        {ASCII_LOGO}
      </pre>
      <div className="terminal-output">
        <p className="text-green-400">Welcome to Hack Club Launchpad!</p>
        <p className="text-gray-400 mt-2">
          This platform connects Hack Clubbers who need 3D printed parts with
          those who can print them.
        </p>
        <p className="text-yellow-400 mt-4">Available commands:</p>
        <p className="text-primary">1) continue</p>
        <p className="text-primary">2) exit</p>
      </div>
      <CommandInput
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const value = (e.target as HTMLInputElement).value;
            if (value === "1" || value.toLowerCase() === "continue") onNext();
            else if (value === "2" || value.toLowerCase() === "exit")
              window.location.href = "/";
          }
        }}
      />
    </>
  );
};

const UserTypeStep = ({ onNext, onBack }: StepProps) => {
  const [inputValue, setInputValue] = useState("");
  return (
    <div className="terminal-output">
      <p className="text-green-400">Select your role:</p>
      <p className="text-gray-400 mt-2">How would you like to participate?</p>
      <p className="text-yellow-400 mt-4">Available commands:</p>
      <p className="text-primary">1) requestor - I need parts printed</p>
      <p className="text-primary">
        2) printer - I want to print parts for others
      </p>
      <p className="text-primary">3) back - Go back</p>
      <CommandInput
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const value = (e.target as HTMLInputElement).value.toLowerCase();
            if (value === "1" || value === "requestor") onNext("requestor");
            else if (value === "2" || value === "printer") onNext("printer");
            else if (value === "3" || value === "back") onBack?.();
          }
        }}
      />
    </div>
  );
};

const PrinterConfigStep = ({ onNext, onBack }: StepProps) => {
  const [printerBrand, setPrinterBrand] = useState<string>("");
  const [buildVolume, setBuildVolume] = useState("");
  const [configStep, setConfigStep] = useState<"brand" | "volume" | "confirm">(
    "brand"
  );
  const [inputValue, setInputValue] = useState("");

  const renderPrompt = () => {
    switch (configStep) {
      case "brand":
        return (
          <>
            <p className="text-green-400">Printer Configuration</p>
            <p className="text-yellow-400 mt-2">Select printer brand:</p>
            <p className="text-gray-400">Enter the number of your choice:</p>
            {PRINTER_BRANDS.map((brand, index) => (
              <p key={brand} className="text-primary">
                {index + 1}) {brand}
              </p>
            ))}
            <p className="text-primary">6) back - Go back</p>
            <CommandInput
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = (e.target as HTMLInputElement).value;
                  if (value === "6" || value.toLowerCase() === "back") {
                    onBack?.();
                  } else {
                    const index = Number.parseInt(value) - 1;
                    if (index >= 0 && index < PRINTER_BRANDS.length) {
                      setPrinterBrand(PRINTER_BRANDS[index]);
                      setConfigStep("volume");
                      setInputValue("");
                    }
                  }
                }
              }}
            />
          </>
        );
      case "volume":
        return (
          <>
            <p className="text-green-400">Build Volume Configuration</p>
            <p className="text-yellow-400 mt-2">
              Enter build volume (format: WxHxD, e.g. 220x220x250):
            </p>
            <p className="text-gray-400">Or type &quot;back&quot; to return</p>
            <CommandInput
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = (
                    e.target as HTMLInputElement
                  ).value.toLowerCase();
                  console.log("Build volume input:", value);
                  console.log("Matches regex?", value.match(/^\d+x\d+x\d+$/));
                  if (value === "back") {
                    console.log("Going back to brand selection");
                    setConfigStep("brand");
                    setInputValue("");
                  } else if (value.match(/^\d+x\d+x\d+$/)) {
                    console.log("Valid build volume, proceeding to confirm");
                    setBuildVolume(value);
                    setConfigStep("confirm");
                    setInputValue("");
                  } else {
                    console.log(
                      "Invalid format. Please use format: WxHxD (e.g. 220x220x250)"
                    );
                  }
                }
              }}
            />
          </>
        );
      case "confirm":
        return (
          <>
            <p className="text-green-400">Configuration Summary:</p>
            <p className="text-primary">Printer Brand: {printerBrand}</p>
            <p className="text-primary">Build Volume: {buildVolume}</p>
            <p className="text-yellow-400 mt-4">Available commands:</p>
            <p className="text-primary">1) confirm - Save configuration</p>
            <p className="text-primary">2) back - Edit configuration</p>
            <CommandInput
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = (
                    e.target as HTMLInputElement
                  ).value.toLowerCase();
                  if (value === "1" || value === "confirm") {
                    onNext({ printerBrand, buildVolume });
                  } else if (value === "2" || value === "back") {
                    setConfigStep("brand");
                    setInputValue("");
                  }
                }
              }}
            />
          </>
        );
    }
  };

  return <div className="terminal-output">{renderPrompt()}</div>;
};

const FinalStep = ({ onNext, loading }: StepProps) => {
  const [inputValue, setInputValue] = useState("");
  return (
    <div className="terminal-output">
      <p className="text-green-400">🎉 Setup Complete!</p>
      <p className="text-gray-400 mt-2">
        You&apos;re all set to start using Launchpad.
      </p>
      {loading ? (
        <p className="text-yellow-400 mt-4">Processing...</p>
      ) : (
        <>
          <p className="text-yellow-400 mt-4">Available commands:</p>
          <p className="text-primary">1) start - Begin your journey</p>
          <CommandInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                ((e.target as HTMLInputElement).value.toLowerCase() === "1" ||
                  (e.target as HTMLInputElement).value.toLowerCase() ===
                    "start")
              ) {
                onNext();
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export function OnboardingDialog({
  open,
  onOpenChange,
}: OnboardingDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const data = useRef<{
    user_type?: "printer" | "requestor";
    printer_brand?: string;
    build_volume?: string;
  }>({});

  const handleNext = async (
    stepData?:
      | "printer"
      | "requestor"
      | { printerBrand: string; buildVolume: string }
  ) => {
    if (step === 2 && typeof stepData === "string") {
      console.log("Setting user type:", stepData);
      data.current.user_type = stepData;
      if (stepData === "printer") {
        setStep(3);
      } else {
        setStep(4);
      }
      return;
    } else if (step === 3 && typeof stepData === "object") {
      data.current.printer_brand = stepData.printerBrand;
      data.current.build_volume = stepData.buildVolume;
    } else if (step === 4) {
      setLoading(true);
      const formData = new FormData();
      formData.append("onboarded", "on");
      formData.append(
        "has_printer",
        data.current.user_type === "printer" ? "on" : "off"
      );
      if (data.current.printer_brand) {
        formData.append("printer_type", data.current.printer_brand);
        formData.append(
          "printer_details",
          `Build Volume: ${data.current.build_volume}`
        );
      }
      await updateUserSettings(formData);
      setLoading(false);
      onOpenChange(false);
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && dialogRef.current) {
        e.preventDefault();
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;

        const rect = dialogRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        dialogRef.current.style.left = `${Math.max(0, Math.min(maxX, newX))}px`;
        dialogRef.current.style.top = `${Math.max(0, Math.min(maxY, newY))}px`;
      }
    },
    [isDragging]
  );

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

  const getStepContent = () => {
    switch (step) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return <UserTypeStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <PrinterConfigStep onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <FinalStep onNext={handleNext} loading={loading} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="font-mono bg-black/95 border border-green-500/20 rounded-lg overflow-hidden shadow-2xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col p-0"
        style={{
          maxWidth: "min(95vw, 600px)",
          minHeight: "400px",
          maxHeight: "min(95vh, 600px)",
        }}
        hasCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Terminal - Launchpad Setup</DialogTitle>
          <DialogDescription>Welcome to Hack Club Launchpad!</DialogDescription>
        </VisuallyHidden>
        <div className="bg-black/90 p-2 flex items-center justify-between border-b border-green-500/20 h-[2.375rem]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="text-green-400 text-sm select-none">
            Terminal - Launchpad Setup
          </div>
          <div className="w-16" />
        </div>
        <div className="p-4 h-full overflow-y-auto terminal-content !text-sm sm:!text-base">
          {getStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

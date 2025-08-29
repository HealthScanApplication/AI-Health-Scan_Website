function Input() {
  return (
    <div
      className="bg-[#ffffff] h-[56.5px] relative rounded-tl-[24px] rounded-tr-[24px] shrink-0 w-full"
      data-name="Input"
    >
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 h-[56.5px] items-center justify-center px-[33px] py-[13px] relative w-full">
          <div className="font-['Poppins:SemiBold',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#797a89] text-[16px] text-left text-nowrap">
            <p className="block leading-[normal] whitespace-pre">
              Add your email gain +1 Month free
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div
      className="bg-[#000000] h-[56.5px] relative rounded-bl-[24px] rounded-br-[24px] rounded-tl-[8px] rounded-tr-[8px] shrink-0 w-full"
      data-name="Button"
    >
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 h-[56.5px] items-center justify-center px-[152px] py-4 relative w-full">
          <div className="font-['Poppins:SemiBold',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[20px] text-left text-nowrap">
            <p className="block leading-[normal] whitespace-pre">
              Join Waitlist
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function All() {
  return (
    (
      <div className="bypass-link">
        <a role="link" tabIndex="0">
          Skip to main content
        </a>
      </div>
    ),
    (
      <div
        className="bg-[#ffffff] relative rounded-3xl size-full"
        data-name="All"
      >
        <div className="relative size-full">
          <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative size-full">
            <Input />
            <Button />
          </div>
        </div>
      </div>
    )
  );
}
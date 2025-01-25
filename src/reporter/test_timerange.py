def format_time_range(milliseconds):
    # Convertire millisecondi in secondi
    seconds = milliseconds / 1000
    
    # Calcolo delle unità di tempo
    minute = 60
    hour = minute * 60
    day = hour * 24
    week = day * 7
    month = day * 30  # Approssimazione di un mese
    year = month * 12

    # Determinare il time range
    if seconds >= year:
        return f"{int(seconds // year)}Y"
    elif seconds >= month:
        return f"{int(seconds // month)}M"
    elif seconds >= week:
        return f"{int(seconds // week)}W"
    elif seconds >= day:
        return f"{int(seconds // day)}D"
    elif seconds >= hour:
        return f"{int(seconds // hour)}H"
    elif seconds >= minute:
        return f"{int(seconds // minute)}m"
    else:
        return f"{int(seconds)}s"

# Esempio di utilizzo
milliseconds_input = int(input("Inserisci i millisecondi: "))
time_range = format_time_range(milliseconds_input)
print(f"Il time range corrispondente è: {time_range}")

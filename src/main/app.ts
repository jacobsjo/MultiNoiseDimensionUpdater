import * as nbt from 'deepslate'

const openButton = document.getElementById("open");
const statusDiv = document.getElementById("status");
const downloadButton = document.getElementById("download");

var converted: nbt.NamedNbtTag = undefined

openButton.onclick = () => {
    const input = document.createElement('input') as HTMLInputElement
    input.type = 'file'
    input.accept = '*.dat'

    input.onchange = (evt) => {
        const file = (evt.target as HTMLInputElement).files[0]

        const reader = new FileReader();
        reader.readAsArrayBuffer(file)

        reader.onload = (evt: ProgressEvent<FileReader>) => {
            if (evt.target.result instanceof ArrayBuffer){
                downloadButton.classList.add("disabled")
                statusDiv.innerHTML = ""
                converted = undefined

                try{
                    const {result, compressed} = nbt.read(new Uint8Array(evt.target.result))

                    const Data = result.value["Data"]  
                    if (Data.type !== "compound"){
                        addStatus("error", "Could not read nbt: Data not a compound Tag")
                        return
                    }
                    const WorldGenSettings = Data.value["WorldGenSettings"]
                    if (WorldGenSettings.type !== "compound"){
                        addStatus("error", "Could not read nbt: WorldGenSettings not a compound Tag")
                        return
                    }
                    const dimensions = WorldGenSettings.value["dimensions"]
                    if (dimensions.type !== "compound"){
                        addStatus("error", "Could not read nbt: dimensions not a compound Tag")
                        return
                    }
    
                    var converted_count = 0
                    for (const dimension_name in dimensions.value){
                        const dimension = dimensions.value[dimension_name]
                        if (dimension.type !== "compound"){
                            addStatus("warn", "Could not read dimension " + dimension_name + ": not a compound Tag")
                            continue
                        }
                        const generator = dimension.value["generator"]
                        if (generator.type !== "compound"){
                            addStatus("warn", "Could not read dimension " + dimension_name + ": generator not a compound Tag")
                            continue
                        }
                        const biome_source = generator.value["biome_source"]
                        if (biome_source.type !== "compound"){
                            addStatus("warn", "Could not read dimension " + dimension_name + ": biome_source not a compound Tag")
                            continue
                        }
                        const type = biome_source.value['type']
                        if (type.type !== "string"){
                            addStatus("warn", "Could not read dimension " + dimension_name + ": type not a string Tag")
                            continue
                        }
                        if (type.value !== "minecraft:multi_noise"){
                            addStatus("info", "Did not convert dimension " + dimension_name + ": not a multi_noise dimension")
                            continue
                        }
    
                        if (biome_source.value['preset'] !== undefined){
                            addStatus("info", "Did not convert dimension " + dimension_name + ": using vanilla preset dimension")
                            continue
                        }
    
                        delete biome_source.value["weirdness_noise"]
                        delete biome_source.value["altitude_noise"]
                        delete biome_source.value["humidity_noise"]
                        delete biome_source.value["temperature_noise"]
                        delete biome_source.value["biomes"]
                        biome_source.value["preset"] = {
                            type: "string",
                            value: "minecraft:overworld"
                        }
                        
                        converted_count ++
                        addStatus("ok", "Successuflly converted " + dimension_name)
                    }
    
                    if (converted_count === 0){
                        addStatus("error", "No dimension converted")
                        return
                    }
    
                    addStatus("ok", "Conversion Successfull")
    
                    converted = result
                    downloadButton.classList.remove("disabled")                    
                } catch {
                    addStatus("error", "Cound not read level.dat")
                    return
                }


            }
        }
    }

    input.click()
}


downloadButton.onclick = (evt: Event) => {
    if (converted === undefined){
        return
    }

    const bb = new Blob([nbt.write(converted, true).buffer])
    const a = document.createElement('a')
    a.download = "level.dat"
    a.href = window.URL.createObjectURL(bb)
    a.click()
}

function addStatus(type: "error" | "warn" | "ok" | "info", message: string){
    const div = document.createElement("div")
    div.classList.add(type)
    div.innerHTML = message
    statusDiv.appendChild(div)
}

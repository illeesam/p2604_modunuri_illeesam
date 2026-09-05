package com.shopjoy.ecBeBo.base.sy.mapper;

import com.shopjoy.ecBeBo.base.sy.data.dto.SyDeptDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface SyDeptMapper {

    /** 트리조회 */
    List<SyDeptDto.Item> selectTree();
}

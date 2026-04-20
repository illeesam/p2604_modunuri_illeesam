package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVocDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyVocMapper {

    SyVocDto selectById(@Param("id") String id);

    List<SyVocDto> selectList(@Param("p") Map<String, Object> p);

    List<SyVocDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyVoc entity);
}

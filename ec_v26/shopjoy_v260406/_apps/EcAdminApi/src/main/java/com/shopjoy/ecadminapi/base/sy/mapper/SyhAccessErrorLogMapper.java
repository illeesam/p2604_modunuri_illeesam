package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyhAccessErrorLogMapper {

    List<SyhAccessErrorLogDto> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);
}

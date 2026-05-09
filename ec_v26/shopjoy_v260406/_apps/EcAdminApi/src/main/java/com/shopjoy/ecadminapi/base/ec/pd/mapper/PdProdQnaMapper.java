package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdQnaMapper {

    PdProdQnaDto.Item selectById(@Param("id") String id);

    List<PdProdQnaDto.Item> selectList(PdProdQnaDto.Request req);

    List<PdProdQnaDto.Item> selectPageList(PdProdQnaDto.Request req);

    long selectPageCount(PdProdQnaDto.Request req);

    int updateSelective(PdProdQna entity);
}

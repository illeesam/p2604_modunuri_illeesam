package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy1Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy2Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy3;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy1Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy2Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy3Mapper;
import org.springframework.util.StringUtils;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSamy3Service {

    private final ZzSamy1Mapper zzSamy1Mapper;
    private final ZzSamy2Mapper zzSamy2Mapper;
    private final ZzSamy3Mapper zzSamy3Mapper;

    /** getById — 조회 (상위 samy1 / samy2 포함) */
    public ZzSamy3Dto.Item getById(String samy3Id) {
        ZzSamy3Dto.Item dto = zzSamy3Mapper.selectById(samy3Id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + samy3Id + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
        return dto;
    }

    /** getList — 조회 (각 항목에 상위 samy1 / samy2 포함) */
    public List<ZzSamy3Dto.Item> getList(ZzSamy3Dto.Request req) {
        List<ZzSamy3Dto.Item> list = zzSamy3Mapper.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /** getPageData — 조회 (각 항목에 상위 samy1 / samy2 포함) */
    public ZzSamy3Dto.PageResponse getPageData(ZzSamy3Dto.Request req) {
        PageHelper.addPaging(req);
        List<ZzSamy3Dto.Item> list = zzSamy3Mapper.selectPageList(req);
        _listFillRelations(list);
        long total = zzSamy3Mapper.selectPageCount(req);
        ZzSamy3Dto.PageResponse res = new ZzSamy3Dto.PageResponse();
        return res.setPageInfo(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (상위 samy1 / samy2 단건을 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 samy1 1회 + samy2 1회만 조회한다.
     */
    private void _listFillRelations(List<ZzSamy3Dto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> samy1Ids = list.stream()
            .map(ZzSamy3Dto.Item::getSamy1Id)
            .filter(StringUtils::hasText)
            .distinct()
            .toList();
        List<String> samy2Ids = list.stream()
            .map(ZzSamy3Dto.Item::getSamy2Id)
            .filter(StringUtils::hasText)
            .distinct()
            .toList();

        // 상위 samy1 일괄조회 → Map<samy1Id, samy1>
        Map<String, ZzSamy1Dto.Item> samy1Map = Map.of();
        if (!samy1Ids.isEmpty()) {
            ZzSamy1Dto.Request req1 = new ZzSamy1Dto.Request();
            req1.setSamy1Ids(samy1Ids);
            samy1Map = zzSamy1Mapper.selectList(req1).stream()
                .collect(Collectors.toMap(ZzSamy1Dto.Item::getSamy1Id, x -> x, (a, b) -> a));
        }

        // 상위 samy2 일괄조회 → Map<samy2Id, samy2>
        Map<String, ZzSamy2Dto.Item> samy2Map = Map.of();
        if (!samy2Ids.isEmpty()) {
            ZzSamy2Dto.Request req2 = new ZzSamy2Dto.Request();
            req2.setSamy2Ids(samy2Ids);
            samy2Map = zzSamy2Mapper.selectList(req2).stream()
                .collect(Collectors.toMap(ZzSamy2Dto.Item::getSamy2Id, x -> x, (a, b) -> a));
        }

        // 각 항목에 분배
        for (ZzSamy3Dto.Item item : list) {
            item.setSamy1(samy1Map.get(item.getSamy1Id()));
            item.setSamy2(samy2Map.get(item.getSamy2Id()));
        }
    }

    /** 상위 계층(samy1 / samy2) 채우기 */
    private void _itemFillRelations(ZzSamy3Dto.Item item) {
        if (StringUtils.hasText(item.getSamy1Id()))
            item.setSamy1(zzSamy1Mapper.selectById(item.getSamy1Id()));
        if (StringUtils.hasText(item.getSamy2Id()))
            item.setSamy2(zzSamy2Mapper.selectById(item.getSamy2Id()));
    }

    /** create — 생성 */
    @Transactional
    public ZzSamy3 create(ZzSamy3 body) {
        body.setSamy3Id(CmUtil.generateId("zz_samy3"));
        body.setRgtr(SecurityUtil.getAuthUser().authId());
        body.setRegDt(LocalDate.now());
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        if (zzSamy3Mapper.insert(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** update — 수정 */
    @Transactional
    public ZzSamy3 update(String samy3Id, ZzSamy3 body) {
        if (zzSamy3Mapper.selectById(samy3Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + samy3Id + "::" + CmUtil.svcCallerInfo(this));
        body.setSamy3Id(samy3Id);
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        if (zzSamy3Mapper.update(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzSamy3 entity) {
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        return zzSamy3Mapper.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String samy3Id) {
        if (zzSamy3Mapper.selectById(samy3Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + samy3Id + "::" + CmUtil.svcCallerInfo(this));
        if (zzSamy3Mapper.delete(samy3Id) != 1)
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }
}

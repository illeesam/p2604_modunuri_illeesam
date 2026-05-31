package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbDeviceTokenRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MbDeviceTokenService {

    private final MbDeviceTokenRepository mbDeviceTokenRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public MbDeviceTokenDto.Item getById(String id) {
        MbDeviceTokenDto.Item dto = mbDeviceTokenRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbDeviceTokenDto.Item getByIdOrNull(String id) {
        return mbDeviceTokenRepository.selectById(id).orElse(null);
    }

    /* 상세조회 */
    public MbDeviceToken findById(String id) {
        return mbDeviceTokenRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbDeviceToken findByIdOrNull(String id) {
        return mbDeviceTokenRepository.findById(id).orElse(null);
    }

    /* 키검증 */
    public boolean existsById(String id) {
        return mbDeviceTokenRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbDeviceTokenRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 목록조회 */
    public List<MbDeviceTokenDto.Item> getList(MbDeviceTokenDto.Request req) {
        return mbDeviceTokenRepository.selectList(req);
    }

    /* 페이지조회 */
    public MbDeviceTokenDto.PageResponse getPageData(MbDeviceTokenDto.Request req) {
        PageHelper.addPaging(req);
        return mbDeviceTokenRepository.selectPageData(req);
    }

    /* 등록 */
    @Transactional
    public MbDeviceToken create(MbDeviceToken body) {
        body.setDeviceTokenId(CmUtil.generateId("mb_device_token"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbDeviceToken saved = mbDeviceTokenRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 수정 */
    @Transactional
    public MbDeviceToken update(String id, MbDeviceToken body) {
        CmUtil.requireId(id, "id", this);
        MbDeviceToken entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "deviceTokenId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbDeviceToken saved = mbDeviceTokenRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 수정 */
    @Transactional
    public MbDeviceToken updateSelective(MbDeviceToken entity) {
        if (entity.getDeviceTokenId() == null) throw new CmBizException("deviceTokenId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDeviceTokenId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDeviceTokenId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbDeviceTokenRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MbDeviceToken entity = findById(id);
        mbDeviceTokenRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public MbDeviceToken save(String cmd, MbDeviceToken entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getDeviceTokenId() == null || entity.getDeviceTokenId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getDeviceTokenId() == null)
                    throw new CmBizException("삭제 대상 deviceTokenId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!mbDeviceTokenRepository.existsById(entity.getDeviceTokenId()))
                    throw new CmBizException("존재하지 않는 MbDeviceToken입니다: " + entity.getDeviceTokenId() + "::" + CmUtil.svcCallerInfo(this));
                mbDeviceTokenRepository.deleteById(entity.getDeviceTokenId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setDeviceTokenId(CmUtil.generateId("mb_device_token"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                MbDeviceToken saved = mbDeviceTokenRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getDeviceTokenId() == null)
                    throw new CmBizException("수정 대상 deviceTokenId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = mbDeviceTokenRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 MbDeviceToken입니다: " + entity.getDeviceTokenId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getDeviceTokenId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<MbDeviceToken> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (MbDeviceToken row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getDeviceTokenId() == null || row.getDeviceTokenId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, MbDeviceToken::getDeviceTokenId, "U", "deviceTokenId", this);
            CmUtil.requireRowIds(rows, MbDeviceToken::getDeviceTokenId, "D", "deviceTokenId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(MbDeviceToken::getDeviceTokenId)
                .toList();
            if (!deleteIds.isEmpty()) {
                mbDeviceTokenRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<MbDeviceToken> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (MbDeviceToken row : updateRows) {
                row.setUpdBy(authId);
                int affected = mbDeviceTokenRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getDeviceTokenId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<MbDeviceToken> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (MbDeviceToken row : insertRows) {
                row.setDeviceTokenId(CmUtil.generateId("mb_device_token"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                mbDeviceTokenRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
